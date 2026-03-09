import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import admin, { db, storage } from '../config/firebase-config.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import { createDocumentSchema } from '../validators/documents.js';
import { AppError, NotFoundError } from '../errors/AppError.js';
import dbController from '../db.js';
import { ROLES, MANAGEMENT_ROLES } from '../constants/roles.js';

const FieldValue = admin.firestore.FieldValue;

const router = Router();

// Configuración de multer (memoria)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

/**
 * @route POST /api/documents
 * @desc Subir un nuevo documento (Sube a Storage y guarda registro en Firestore)
 * @access Private
 */
router.post(
    '/',
    verifyToken,
    upload.single('file'),
    asyncHandler(async (req, res) => {
        if (!process.env.FIREBASE_STORAGE_BUCKET) {
            throw new AppError('Configuración faltante: FIREBASE_STORAGE_BUCKET no está definido en el servidor.', 500);
        }

        if (!req.file) {
            throw new AppError('Debes adjuntar un archivo (campo "file")', 400);
        }

        // Validar body metadata (user_id, type, title)
        const parseResult = createDocumentSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                error: 'Datos de documento inválidos',
                details: parseResult.error.format()
            });
        }

        const { user_id, type, title } = parseResult.data;

        // Verificar permisos:
        // Un empleado solo puede subirse documentos a sí mismo (y generalmente no lo hacen).
        if (req.user.uid !== user_id && !MANAGEMENT_ROLES.includes(req.user.role)) {
            throw new AppError('No tienes permisos para subir documentos a este usuario.', 403);
        }

        // Subir a Firebase Storage
        const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
        const fileExt = req.file.originalname.split('.').pop() || '';
        const uniqueName = `${Date.now()}_${crypto.randomBytes(12).toString('hex')}.${fileExt}`;
        const storagePath = `documents/${user_id}/${uniqueName}`;

        const fileRef = bucket.file(storagePath);

        await fileRef.save(req.file.buffer, {
            metadata: {
                contentType: req.file.mimetype,
                metadata: {
                    originalName: req.file.originalname,
                    uploadedBy: req.user.uid
                }
            }
        });

        // Registrar metadata en Firestore
        const docRef = await db.collection('documents').add({
            user_id,
            type,
            title,
            storage_path: storagePath,
            upload_date: FieldValue.serverTimestamp(),
            content_type: req.file.mimetype,
            original_name: req.file.originalname,
            uploaded_by: req.user.uid,
            status: 'PENDING' // Added for signature feature
        });

        // Audit log
        await dbController.audit(req.user.uid, 'DOCUMENT_UPLOAD', 'documents', docRef.id, { user_id, type, title });

        res.status(201).json({
            message: 'Documento subido correctamente',
            id: docRef.id,
            storage_path: storagePath
        });
    })
);

/**
 * @route GET /api/documents
 * @desc Listar documentos (propio para Empleados, global/filtro para Admin)
 * @access Private
 */
router.get(
    '/',
    verifyToken,
    asyncHandler(async (req, res) => {
        const { user_id } = req.query;

        let query = db.collection('documents');

        // Empleados solo ven los suyos
        if (req.user.role === ROLES.USER) {
            query = query.where('user_id', '==', req.user.uid);
        } else {
            // Admin/Jefatura pueden filtrar por user_id
            if (user_id) {
                query = query.where('user_id', '==', user_id);
            }
        }

        query = query.orderBy('upload_date', 'desc');

        const snapshot = await query.get();
        const documents = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            documents.push({
                id: doc.id,
                ...data,
                upload_date: data.upload_date ? data.upload_date.toDate() : null
            });
        });

        res.json(documents);
    })
);

/**
 * @route GET /api/documents/:id/download
 * @desc Obtener una URL firmada para descargar el archivo (Válida por corto tiempo)
 * @access Private
 */
router.get(
    '/:id/download',
    verifyToken,
    asyncHandler(async (req, res) => {
        if (!process.env.FIREBASE_STORAGE_BUCKET) {
            throw new AppError('Configuración faltante: FIREBASE_STORAGE_BUCKET no está definido en el servidor.', 500);
        }

        const { id } = req.params;
        const docSnap = await db.collection('documents').doc(id).get();

        if (!docSnap.exists) {
            throw new NotFoundError('Documento');
        }

        const docData = docSnap.data();

        // Verificamos permisos de lectura
        if (req.user.role === ROLES.USER && docData.user_id !== req.user.uid) {
            throw new AppError('Acceso denegado a este documento', 403);
        }

        const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
        const fileRef = bucket.file(docData.storage_path);

        // Generar signed URL por 15 minutos
        const [url] = await fileRef.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutos
            promptSaveAs: docData.original_name
        });

        res.json({ downloadUrl: url });
    })
);

/**
 * @route DELETE /api/documents/:id
 * @desc Eliminar un documento lógica y físicamente
 * @access Private (Admin only)
 */
router.delete(
    '/:id',
    verifyToken,
    authorize(ROLES.ADMIN),
    asyncHandler(async (req, res) => {
        if (!process.env.FIREBASE_STORAGE_BUCKET) {
            throw new AppError('Configuración faltante: FIREBASE_STORAGE_BUCKET no está definido en el servidor.', 500);
        }

        const { id } = req.params;
        const docRef = db.collection('documents').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            throw new NotFoundError('Documento');
        }

        const docData = docSnap.data();

        // Borrar del bucket
        const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
        const fileRef = bucket.file(docData.storage_path);

        try {
            await fileRef.delete();
        } catch (storageErr) {
            console.warn(`Could not delete file ${docData.storage_path} from bucket, it may not exist.`, storageErr);
        }

        // Borrar de Firestore
        await docRef.delete();

        // Audit log
        await dbController.audit(req.user.uid, 'DOCUMENT_DELETE', 'documents', id, { storage_path: docData.storage_path, title: docData.title });

        res.json({ message: 'Documento eliminado correctamente' });
    })
);

/**
 * @route POST /api/documents/:id/sign 
 * @desc Firmar electrónicamente un documento
 * @access Private
 */
router.post(
    '/:id/sign',
    verifyToken,
    asyncHandler(async (req, res) => {
        const docRef = db.collection('documents').doc(req.params.id);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists || docSnapshot.data().user_id !== req.user.uid) {
            throw new NotFoundError('Documento');
        }
        if (docSnapshot.data().status === 'SIGNED') {
            throw new AppError('El documento ya está firmado', 400);
        }

        const signedAt = new Date().toISOString();
        await docRef.update({
            status: 'SIGNED',
            signedAt
        });

        await dbController.audit(req.user.uid, 'DOCUMENT_SIGN', 'documents', req.params.id, { signedAt });

        res.json({ message: 'Documento firmado correctamente', signedAt });
    })
);

export default router;
