A continuación te dejo **la extracción completa y ordenada** de los puntos conversados/requeridos para la **Plataforma / Sistema de Gestión de Personas (RRHH)**, según la transcripción “Plataforma RRHH: diseño e integraciones (24 feb 2026)”.

---

**1\) Canales del sistema: Web vs App (y qué se puede hacer en cada uno)**

1. **La marcación (entrada/salida) NO debe existir en la web**: “nunca” en la página; debe ser **solo por celular/app**.  
2. La **app** debe ser **descargable** (se menciona que se cambió arquitectura para adaptarla a teléfono).  
3. Se menciona opción de **foto / reconocimiento facial**, pero queda como **etapa posterior** y “no es necesario” ahora.  
4. En web puede mostrarse asistencia (visualización), pero **sin registrar marcaje**; además se conversa que el usuario podría tener **pestaña del mes** y **pestaña del historial completo** o **filtro por fechas**.  
5. Se deja explícito que **nadie debería poder “registrar” (marcar) por la página**.

---

**2\) Acceso, soporte y recuperación de contraseña**

1. Botón **“Contacta RRHH”**: se entiende como **contactar a la empresa/soporte**, pero como aún “no hay alguien”, debe ir a **soporte técnico / admin**.  
2. **Recuperación de contraseña**: cambiar/ajustar a “restaurar/recuperar contraseña” y que el sistema **envíe un correo al email vinculado** para reset.

**Nota técnica conversada (infra):** se menciona “Railway para el back y Firebase y Vercel…” y que son privadas.

---

**3\) Roles / Perfiles (y nombres correctos)**

1. Deben existir **solo 3 roles**: **Usuario, Jefatura, Admin**.  
2. **No usar** nombres tipo “perfil gestión de personas” o “perfil recursos humanos” (evitar ese término en roles).  
3. El sistema debe **separar lo que ve cada perfil**: Admin ve todo; Usuario ve “mi asistencia”.  
4. Se conversa la situación de **movilidad interna**: si alguien pasa a jefatura, se le “cambia el usuario/rol” (no crear infinitos tipos).

---

**4\) Módulo Asistencia (visualización \+ reglas \+ datos)**

**4.1 Vista de asistencia e histórico (UX)**

1. “Historial reciente” es confuso: se sugiere que sea **histórico**.  
2. Se define que el histórico puede mostrarse **por mes**, **separado por día**.  
3. Posibles opciones de navegación: **pestaña mes / pestaña historial completo** o **filtro entre fechas**.  
4. Preocupación por performance si el histórico es “eterno” (2–4 años), pero igual se acuerda que “sirve”.

**4.2 Integración con control de asistencia (fuente de datos)**

1. La asistencia será alimentada por **otro software** que envía info **diaria/mensual**, etc.  
2. El control de asistencia debe ser **certificado por la Dirección del Trabajo**, y entregará **Excel con datos** (diario/mensual).  
3. Se menciona el proveedor de asistencia: **Geovictoria**.  
4. El proveedor tendría relojes biométricos y también opción de marcar con teléfono (ventaja/alternativa).

**4.3 Reglas de jornada, flexibilidad, redondeos, atrasos, descanso y horas extra**

1. El sistema debe ser “inteligente”: si alguien entra antes, **no** se le puede “contar” salida antes; se define un **tope** (ej.: 08:00).  
2. Flexibilidad: ventana **08:00 a 10:00** (no más).  
3. Los **contratos estarán ingresados en la plataforma**, y de ahí el sistema entiende reglas (incluye caso de **artículo 22** donde incluso “ni siquiera marca”).  
4. Redondeo / atrasos: se discute política de redondeo (ej. “10 para las 8 → 8”), y se fija que el atraso se considera **desde los 15 minutos**.  
5. Descanso/almuerzo:  
   * Se sugiere establecer **1 hora** (por simplicidad) y que el sistema **descuente automáticamente** esa hora.  
   * Se menciona norma: si se superan 5 horas debe existir descanso; el Código del Trabajo habla de **mínimo 30 min** (mencionan art. 34).  
6. Jornada semanal y horas extra/compensatorias:  
   * Se menciona **45 horas semanales** (y que se puede calcular por semana o por día con resta).  
   * Las horas extra que pasan a compensatorias ocurren **después de 60 minutos** y **no son acumulables entre días** (ej. 30 min hoy \+ 30 min mañana NO suma).

---

**5\) Módulo “Solicitudes y Permisos” (qué incluye y cómo se llama)**

1. Cambios de nombre: donde decía “Vacaciones”, debe decir **“Feriados legales”**.  
2. **Licencias médicas NO van aquí**: “no es una solicitud”, van en módulo aparte.  
3. En “Solicitudes y permisos” deben quedar:  
   * **Permisos administrativos**  
   * **Feriados legales**  
   * **Permisos médicos**  
   * **Horas compensatorias** (también se menciona que puede llamarse “compensatorio”).  
4. Aunque “horas compensatorias” no sea un permiso legal, por **experiencia de usuario** conviene que todo quede en un solo lugar de permisos.

---

**6\) Formularios de solicitudes (campos, autocompletado y restricciones)**

**6.1 Principios generales del formulario**

1. Cada solicitud debe abrir un **formulario** y ser **cómodo** para el usuario.  
2. Se pide “un descargable simple”, pero luego se plantea crear el formulario **dentro de la plataforma** (llenado digital).  
3. Campo “Motivo”: se duda si es necesario, pero se concluye que **sí conviene** al digitalizar “para conversar menos” (evitar idas y vueltas).

**6.2 Ejemplo detallado: “Solicitud de Permiso Administrativo”**

Campos y reglas conversadas:

1. **Fecha de solicitud**: debe quedar **automática** (fecha del día al enviar); el usuario **no** la escribe.  
2. **Fecha de ejecución** del permiso: esa sí debe ingresarla el usuario (fecha en que se tomará el permiso).  
3. Autocompletar datos del usuario: **Nombre, Rut, Cargo**.  
4. Mostrar saldo: “administrativos pendientes” como dato interno cargado por admin y actualizado automáticamente al aprobarse (se “resta” al aprobar).  
5. Restricción de cantidad:  
   * Solo **2 opciones**: **día completo** o **medio día** (no “4 horas” ni “un tercio”).  
6. Si es medio día:  
   * Debe permitir elegir **jornada mañana** o **jornada tarde**.  
   * Se propone UI tipo **“1 o 0,5”** y que si se elige 0,5 habilite **media jornada AM/PM**.  
7. **Fecha de reincorporación**: se calcula automáticamente (ej.: si pide día completo, reincorpora al día siguiente).

---

**7\) Flujo de aprobación (visación \+ autorización) y notificaciones**

1. El flujo debe tener **dos pasos**:  
   * **Visar** (jefatura directa) por coordinación  
   * **Autorizar** (admin) para validar saldos/reglas (“porque esa es la ley”).  
2. La jefatura se determina por **organigrama/asignación de jefatura** y el sistema debe tener esa variable (“jefatura directa” o “persona a cargo de visar”).  
3. Al enviar solicitud:  
   * A jefatura le debe llegar **notificación/correo**.  
   * Tras visación, debe generarse **alerta al admin** para autorización final.  
4. Se afirma que para feriados legales y horas compensatorias es “la misma ruta / mismo proceso”; lo que cambia es tipo de documento y de dónde sale el saldo.

---

**8\) Horas compensatorias (cómo nacen y cuándo se habilitan)**

1. Las horas compensatorias dependen de la asistencia (deben “conversar” con control de asistencia).  
2. Se discute cuándo habilitarlas:  
   * Se plantea “desde mañana” vs “desde el mes siguiente”.  
   * Se justifica que, al venir de horas extra que normalmente se pagan a fin de mes, al convertirlas en compensatorias **se habiliten el mes siguiente** para “regularizar”.

---

**9\) Módulo “Licencias médicas” (separado, con integración externa)**

1. Debe existir un módulo/pestaña **exclusiva** para **Licencias médicas** (no dentro de “Solicitudes”).  
2. Las licencias:  
   * **Llegan electrónicas** (no las entrega el trabajador).  
   * Se mencionan plataformas tipo **Medipass / IMED**.  
3. Acceso y gestión:  
   * Se pide que sea **solo desde admin** y que el sistema permita “centralizar” acceso: abrir link o simular apertura a páginas donde llegan licencias y luego tramitar en **Licencia.cl**.  
4. Integración:  
   * Opción A: **link / hipervínculo** hacia la plataforma externa.  
   * Opción B: **API** para que “lleguen a una bandeja de entrada dentro de la aplicación”.  
5. Estados visibles:  
   * Al trabajador le debe aparecer que su licencia fue **“recepcionada”** (cuando llega a RRHH) y luego **“tramitada”**; incluir **número de folio**.

---

**10\) Documentos: “Mis documentos” \+ contratos \+ liquidaciones**

1. Debe existir sección **“Mis documentos”** donde se concentre el **histórico** de solicitudes ya aprobadas para **descargar** (PDF).  
2. Se mencionan tipos/documentos dentro del ecosistema: **Contrato, Anexo de contrato, Liquidaciones de sueldo**, etc.  
3. Descarga y firma:  
   * Debe existir opción de **descargar** para archivo físico si se quiere.  
   * La **visación y firma** idealmente se hace “por aquí mismo” (en la plataforma).  
   * OJO: también se afirma que **solo el admin** (gestionador) puede descargar. Esto hay que dejarlo definido como regla final.

---

**11\) Notificaciones / Actualizaciones (tipo “feed”)**

1. Debe existir algo tipo **notificaciones/actualizaciones** (estilo “Facebook”): “tu solicitud ha sido avisada / aprobada”, con indicador/badge en la parte superior.

---

**12\) Administración (panel Admin)**

**12.1 Admin Usuarios**

1. Debe permitir **agregar usuarios** y asignar **rol** (Usuario/Jefatura/Admin).  
2. En admin usuarios se ve “histórico” asociado (se menciona histórico de asistencia).  
3. “Gestión de turnos”: existe pero **no sirve para esta empresa**; dejarla para otra empresa y **deshabilitarla** acá.

**12.2 Correcciones manuales por RRHH**

1. Caso típico: alguien se equivoca/no registra; debe enviar una **solicitud** a RRHH para que RRHH ingrese el registro (usuario no tiene permiso).

---

**13\) Documento “No marcaje involuntario” (y política)**

1. Debe existir un documento/solicitud llamado **“no marcaje involuntario”** (para justificar falta de marcaje y gatillar registro manual).  
2. Debe incorporarse en el **reglamento/políticas**, con un **límite** por persona (se menciona “yo diría tres”).

---

**14\) Reportes / Nómina / Indicadores (con exportación)**

1. Debe existir una sección fuerte de **reportes/indicadores**, idealmente con selección por **categorías y subcategorías** para hacerlo dinámico.  
2. Indicadores solicitados explícitamente:  
   * **Ausentismo general**  
   * **Rotación general**  
   * **Licencias por mes** y **por año**  
   * Diferenciar licencias **\< 7 días** vs **\> 7 días**  
   * Ausentismos diferenciados por **feriados legales**, **licencias médicas**, **días compensatorios**  
   * **Horas compensatorias por mes** \+ **uso de horas compensatorias**  
   * **Feriados legales por mes** \+ **concentraciones mensuales**  
   * **Porcentaje de atrasos**  
3. Exportación y estadística:  
   * Para **todos los indicadores**, poder sacar la **base bruta en Excel**.  
   * Además extraer estadísticos como **promedio** y se menciona trabajar con “campana …” para nociones (en la práctica: distribución/curva).  
4. Indicador adicional: **cantidad de solicitudes** de registro de asistencia manual por “no marcaje involuntario”.

---

**15\) Extras / futuras mejoras mencionadas**

1. Pestaña/área “**Beneficios**” (no ahora, pero se sugiere dejar prevista).  
2. Idea de **chatbot** con el **Código del Trabajo cargado**, como módulo aparte; controlar tokens; disponible al menos para admins.

---

Si quieres, puedo tomar esta extracción y dejártela también como **matriz de requerimientos** (Módulo → Requerimiento → Prioridad → Dependencias → Comentarios), pero con lo anterior ya está **todo lo conversado**, ordenado y sin saltarme puntos.

 

 

 

Abajo tienes la **matriz de requerimientos** (extraída de la transcripción *“Plataforma RRHH: diseño e integraciones” del 24-feb-2026* ). La armé **por módulos**, con **IDs únicos**, y con **fuente (líneas)** para que sea audit-able.

**Leyenda “Prioridad (según conversación)”**

* **MUST** \= “tiene que / nunca / en ningún caso”  
* **SHOULD** \= “debería / es mejor”  
* **LATER** \= “más adelante / no es necesario por ahora”  
* **TBD** \= quedó como duda/decisión pendiente

---

**A) Acceso, soporte y arquitectura**

| ID | Módulo | Requerimiento (claro y accionable) | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-001 | Acceso/Soporte | Botón **“Contacta RRHH”** debe operar como **contacto a soporte técnico/admin** (no hay “alguien” dedicado aún). | SHOULD | Todos | Canal de contacto (correo/ticket) |  |
| RQ-002 | Acceso | Flujo **“¿Olvidaste tu contraseña?”**: renombrar a **“Restaurar/Recuperar contraseña”** y **enviar correo al email vinculado**. | MUST | Todos | Email/SMTP \+ gestión credenciales |  |
| RQ-003 | Infra (no funcional) | Stack mencionado: **Railway (back)** \+ **Firebase** \+ **Vercel** (según conversación). | SHOULD | Tech | Infra/Hosting |  |

---

**B) Canales (Web vs App) y UX base**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-004 | Asistencia | **Marcaje (entrada/salida) SOLO por celular**. **En ningún caso** permitir marcaje en la **página web** (“Nunca, nunca, nunca”). | MUST | Usuario | App móvil / proveedor marcaje |  |
| RQ-005 | Asistencia (Web) | En web: **NO existe** el componente/botón de marcar; la web es solo visualización/gestión. | MUST | Usuario | Front web |  |
| RQ-006 | App | La solución móvil debe ser **“descargable”** (app instalada). | MUST | Usuario | Publicación app |  |
| RQ-007 | Asistencia (Web) | Vista de asistencia web debe ofrecer: **pestaña “Mes”** y **pestaña “Historial completo”** o **filtro por fechas**. | SHOULD | Usuario/Admin | Front web |  |
| RQ-008 | Asistencia (UX) | Cambiar label **“historial reciente”** → **“histórico”** y mostrar **por mes correspondiente separado por día**. | SHOULD | Usuario | UI/UX |  |
| RQ-009 | Asistencia (UX) | Considerar performance: el **histórico “eterno”** podría **poner lenta la página**. | SHOULD | Usuario | Performance |  |
| RQ-010 | Asistencia (Móvil) | Se menciona GPS asociado al aplicativo, pero **“todavía no”** (queda como alcance posterior). | LATER | Usuario | GPS/Permisos |  |
| RQ-011 | Identidad (Móvil) | Validación por **foto/reconocimiento facial**: se conversa como opción, pero **para etapa más adelante** y “no es necesario” ahora. | LATER | Usuario | Biométrico |  |

---

**C) Roles y permisos (modelo de seguridad)**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-012 | Seguridad | Deben existir **exactamente 3 roles**: **Usuario / Jefatura / Admin**. | MUST | Admin | RBAC |  |
| RQ-013 | Naming/UX | **No** usar nombres tipo “perfil gestión de personas / perfil recursos humanos” como roles. Mantener “Usuario” literal \+ “Admin”. | MUST | Admin | UI |  |
| RQ-014 | Seguridad | Debe poder **cambiarse el rol** de una persona (caso “movilidad interna”: “le cambia el usuario nomás”). | SHOULD | Admin | Gestión usuarios |  |
| RQ-015 | Seguridad/Accesos | En asistencia: **Admin ve todo**, **Usuario ve solo “mi asistencia”**. | MUST | Usuario/Admin | Permisos |  |

---

**D) Asistencia: integraciones, fuente de datos y reglas**

**D1) Integraciones / datos**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-016 | Asistencia | El marcaje debe apoyarse en sistema **certificado por Dirección del Trabajo** (para implementar marcaje). | MUST | Admin | Proveedor certificado |  |
| RQ-017 | Asistencia | Contratar/control asistencia que entregue **Excel con datos diario/mensual** y se **integre** con software integral. | MUST | Admin | Integración datos |  |
| RQ-018 | Asistencia | Integración vía **API** con app/sistema de control asistencia (relojes biométricos, diseñado para vincularse a software). | MUST | Admin | API proveedor |  |
| RQ-019 | Asistencia | Proveedor mencionado para asistencia: **Geovictoria**. | SHOULD | Admin | Proveedor |  |
| RQ-020 | Asistencia | El proveedor de relojes/asistencia también ofrece **marcar con teléfono** (puede usarse en la estrategia). | SHOULD | Usuario | App proveedor |  |

**D2) Reglas de cálculo (horarios, redondeos, colación, extras)**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-021 | Asistencia | Debe existir **marcar entrada y salida**. | MUST | Usuario | App marcaje |  |
| RQ-022 | Asistencia | Definir regla de **redondeo**: ej. marca “10 para las 8” ⇒ redondea a las 8 (para conteo). | MUST | Admin | Política empresa |  |
| RQ-023 | Asistencia | **Atraso** se considera **desde los 15 minutos**. | MUST | Admin | Política empresa |  |
| RQ-024 | Asistencia | Tope de entrada: si alguien marca antes (ej. 7:45), igual se considera **entrada a las 8** (no “gana” salida antes). | MUST | Usuario | Reglas motor |  |
| RQ-025 | Asistencia | Sistema “inteligente”: salida se calcula por jornada (ej. entra 8 ⇒ sale 17; entra 9 ⇒ sale 18). | MUST | Usuario | Reglas motor |  |
| RQ-026 | Asistencia | Flexibilidad horaria **solo entre 08:00 y 10:00** (no más). | MUST | Usuario | Reglas motor \+ contrato |  |
| RQ-027 | Asistencia | **Colación**: el sistema debe **descontar automáticamente** el periodo (se habla de “una hora”). | MUST | Usuario | Reglas motor |  |
| RQ-028 | Asistencia | Jornada semanal objetivo: **45 horas** (y cálculo considera descuentos). | MUST | Admin | Reglas motor |  |
| RQ-029 | Asistencia | Horas extra → compensatorias **solo si superan 60 minutos** desde la hora de salida. | MUST | Usuario | Reglas motor |  |
| RQ-030 | Asistencia | Horas extra **no acumulables entre días** (ej. 30 min \+ 30 min ≠ 1 hora extra). | MUST | Usuario | Reglas motor |  |
| RQ-031 | Asistencia | Colación: se plantea “variable” de descanso, pero queda explícito que **no existe** solicitud para “media hora”; se asume regla fija/por contrato. | MUST | Usuario | Contrato |  |
| RQ-032 | Contrato | El sistema debe **asumir contratos ingresados en la plataforma** para entender flexibilidad y condiciones. | MUST | Admin | Módulo contratos |  |
| RQ-033 | Contrato/Asistencia | Si el contrato indica **artículo 22**, el sistema entiende que **“ni siquiera marca”** (no pedir marcaje). | MUST | Usuario | Datos contrato |  |
| RQ-034 | Asistencia | “Turno noche” **no existe** (alcance acotado a funcionamiento administrativo). | MUST | Admin | Reglas/parametrización |  |

---

**E) Solicitudes y Permisos (qué incluye y cómo se ve)**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-035 | UI | Renombrar en el sistema: **“Vacaciones” → “Feriados legales”**. | MUST | Usuario | UI |  |
| RQ-036 | UI | El módulo puede llamarse **“Solicitudes y permisos”** (se valida el nombre). | SHOULD | Usuario | UI |  |
| RQ-037 | Alcance | **Licencia médica NO es solicitud** y **no debe ir** dentro de “Solicitudes y permisos”. | MUST | Usuario | Módulo separado |  |
| RQ-038 | Alcance | Dentro de “Solicitudes y permisos” deben existir: **permisos administrativos**, **feriados legales**, **permisos médicos**, **horas compensatorias** (y se menciona también “compensatorio”). | MUST | Usuario | Formularios |  |
| RQ-039 | UX | Aunque “horas compensatorias” no sea permiso legal, en la interfaz debe estar **en el mismo lugar** para que sea más cómodo al usuario. | SHOULD | Usuario | UI |  |

---

**F) Formularios (contenido mínimo \+ caso Permiso Administrativo)**

**F1) Formularios en general**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-040 | Formularios | Debe existir un **formulario por tipo** (“al apretar se envía como el formulario”). | MUST | Usuario | Motor de formularios |  |
| RQ-041 | Formularios | Se pide “**descargable simple**” (y luego se conversa que también se puede completar dentro de la plataforma). | SHOULD | Usuario | PDF/Generación |  |
| RQ-042 | Formularios | En digitalización, el campo **“motivo”** se decide que **sí es bueno** incluirlo (para “conversar menos”). | SHOULD | Usuario | Campo Motivo |  |
| RQ-043 | Datos auto | En formularios: **fecha**, **nombre**, **RUT**, **cargo** vienen por el usuario autenticado (auto-completado). | MUST | Usuario | Perfil usuario |  |
| RQ-044 | Saldos | Los **saldos** (ej. días administrativos) requieren carga/gestión por admin y deben mostrarse automáticamente. | MUST | Admin | Base saldos |  |
| RQ-045 | Documentos | Se requiere **lista completa** de documentos por área \+ **variables** de cada documento para configurarlos en la plataforma. | MUST | Admin | Parametrización |  |

**F2) Permiso Administrativo (reglas del formulario)**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-046 | Permiso Adm. | La **fecha de solicitud** debe quedar por defecto al momento de ingresar (no pedir que la escriba). | MUST | Usuario | Motor formularios |  |
| RQ-047 | Permiso Adm. | La fecha que el usuario debe ingresar es la **fecha de ejecución** del permiso. | MUST | Usuario | Motor formularios |  |
| RQ-048 | Permiso Adm. | El permiso se puede pedir como **día completo** o **medio día** (no fracciones tipo 4 horas/1⁄3). | MUST | Usuario | Reglas motor |  |
| RQ-049 | Permiso Adm. | Si es **medio día**, debe elegir **jornada mañana o tarde**. | MUST | Usuario | UI/Reglas |  |
| RQ-050 | Permiso Adm. | UI sugerida: selector **“0,5”** que habilita “media jornada AM/PM”. | SHOULD | Usuario | UI |  |
| RQ-051 | Permiso Adm. | El saldo “**días administrativos pendientes**” debe **restarse automáticamente** una vez **visado y autorizado**. | MUST | Admin | Workflow \+ saldos |  |
| RQ-052 | Permiso Adm. | **Fecha de reincorporación** debe **calcularse automáticamente** (ej. al día siguiente si pidió día completo). | MUST | Usuario | Reglas motor |  |

---

**G) Flujo de aprobación \+ notificaciones**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-053 | Workflow | Aprobación debe tener **2 líneas**: **Visar** y **Autorizar**. | MUST | Jefatura/Admin | Workflow |  |
| RQ-054 | Workflow | La **jefatura** visa por coordinación; luego **admin** da el “final” revisando saldos (“porque esa es la ley”). | MUST | Jefatura/Admin | Workflow \+ saldos |  |
| RQ-055 | Workflow | Enviar a **jefatura asignada** (según **organigrama**) y que jefatura vea “pendientes” para visar. | MUST | Jefatura | Organigrama |  |
| RQ-056 | Notificaciones | Debe existir variable para que llegue **correo/notificación** al responsable (“para que le llegue el correo”). | MUST | Jefatura/Admin | Email/Notifs |  |
| RQ-057 | Workflow | La misma “ruta” aplica a **permiso administrativo \+ feriados legales \+ horas compensatorias** (cambia el tipo y el saldo). | MUST | Usuario/Admin | Workflow |  |
| RQ-058 | Horas Comp. | **Horas compensatorias** deben “conversar” con **control de asistencia** (saldo fuente distinta). | MUST | Admin | Integración asistencia |  |
| RQ-059 | Horas Comp. | Regla: horas extra → horas compensatorias se **habilitan al mes siguiente** (lógica propuesta). | SHOULD | Usuario/Admin | Reglas \+ asistencia |  |

---

**H) Licencias médicas (módulo separado \+ estados)**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-060 | Licencias | Crear módulo **exclusivo** “Licencias médicas” (aparte). | MUST | Usuario/Admin | UI \+ datos |  |
| RQ-061 | Licencias | Licencias **llegan electrónicamente** (no por el trabajador) y por eso no son “solicitud”. | MUST | Todos | Integración |  |
| RQ-062 | Licencias/Admin | Acceso/gestión de ingreso de licencias debe ser **solo desde Admin** (centralizar acceso). | MUST | Admin | Permisos |  |
| RQ-063 | Integración Licencias | Se mencionan sistemas **Medipass e IMED** y gestión posterior en **Licencia.cl** (abrir/enlazar o integrar). | MUST | Admin | Link-out o API |  |
| RQ-064 | Integración Licencias | Opción A: **vínculo** que envía a la página externa. Opción B: **conexión directa por API** si existe. | SHOULD | Admin | API/SSO |  |
| RQ-065 | Licencias (Estados) | En perfil del usuario debe verse licencia con **folio** y estado **“tramitada”**. | MUST | Usuario | Datos licencias |  |
| RQ-066 | Licencias (Estados) | Considerar mostrar también estado **“recepcionada”** (cuando RRHH la recibe) y luego “tramitada”. | SHOULD | Usuario/Admin | Estados |  |

---

**I) Mis documentos \+ documentos digitales (descarga y repositorio)**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-067 | Mis documentos | En “Mis documentos” se concentrará el **histórico** de solicitudes **aprobadas** para poder descargarlas. | MUST | Usuario/Admin | Repositorio |  |
| RQ-068 | Mis documentos | Las solicitudes aprobadas deben poder descargarse como **PDF**. | MUST | Usuario/Admin | Generador PDF |  |
| RQ-069 | Descarga (regla) | Se conversa que el usuario “podría descargar” para carpeta física, pero luego se afirma: **“solamente el admin puede descargarlo”**. Queda como **decisión a cerrar** (regla final). | TBD | Usuario/Admin | Permisos |  |
| RQ-070 | Firma digital | La intención es que la **visación/firma** se haga **dentro** de la plataforma (y descargar sería opcional). | SHOULD | Jefatura/Admin | Firma |  |
| RQ-071 | Documentos | Se mencionan documentos: **contrato**, **anexo de contrato**, y también **liquidaciones de sueldo** como parte del set documental. | SHOULD | Admin | Documentos |  |

---

**J) Notificaciones, “feed” y beneficios**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-072 | Notificaciones | Pestaña/indicador tipo “feed” estilo Facebook: “tu solicitud fue visada/aprobada”, etc. | SHOULD | Usuario | Notifs |  |
| RQ-073 | Beneficios | Considerar a futuro una pestaña tipo **“beneficios”**. | LATER | Usuario | Contenido beneficios |  |

---

**K) Admin: usuarios, turnos, y asistencia manual**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-074 | Admin/Usuarios | Admin debe **agregar usuarios** y asignarles **rol (Usuario/Jefatura/Admin)**. | MUST | Admin | Gestión usuarios |  |
| RQ-075 | Admin/Usuarios | Se menciona que “todo el resto es manual” (registro/actividades), y que se pueden agregar **selectores/filtros**. | SHOULD | Admin | UI Admin |  |
| RQ-076 | Turnos | “Gestión de turnos” debe existir como pestaña pero **deshabilitada / no aplica** para esta empresa (podría ser para otra). | SHOULD | Admin | Feature flag |  |
| RQ-077 | Asistencia manual | Si alguien “se olvidó/no registró”, debe **enviar solicitud a RRHH** para que RRHH/Admin **ingrese asistencia manual** (el trabajador no puede). | MUST | Usuario/Admin | Nuevo tipo solicitud |  |

---

**L) Reportes y nómina (indicadores \+ exportables)**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-078 | Reportes | Módulo reportes debe permitir **trazabilidad**, **cruces de ausentismo**, **gráficos** e idealmente mostrar de forma **dinámica** con selección simple. | MUST | Admin | BI/UI |  |
| RQ-079 | Reportes | Organizar indicadores por **categorías/subcategorías** para facilitar selección y visualización. | SHOULD | Admin | BI/UI |  |
| RQ-080 | Indicadores | Indicadores principales a extraer: **ausentismo general** y **rotación general**. | MUST | Admin | Datos RRHH |  |
| RQ-081 | Indicadores | Indicadores: **licencias por mes** y **licencias por año**. | MUST | Admin | Datos licencias |  |
| RQ-082 | Indicadores | Diferenciar **licencias cortas (\<7 días)** vs **licencias largas (\>7 días)**. | MUST | Admin | Datos licencias |  |
| RQ-083 | Indicadores | Indicador de ausentismos diferenciados por: **feriados legales**, **licencias médicas**, **días compensatorios**, y **horas compensatorias**. | MUST | Admin | Datos ausentismo |  |
| RQ-084 | Indicadores | Indicador: **horas compensatorias por mes** y **uso de horas compensatorias**. | MUST | Admin | Datos asistencia |  |
| RQ-085 | Indicadores | Indicador: **feriados legales por mes** y **concentraciones mensuales**. | MUST | Admin | Datos feriados |  |
| RQ-086 | Indicadores | Indicador: **porcentaje de atrasos**. | MUST | Admin | Datos asistencia |  |
| RQ-087 | Indicadores | Indicador adicional: **cantidad de solicitudes de registro de asistencia manual por “no marcaje involuntario”**. | MUST | Admin | Solicitud asistencia manual |  |
| RQ-088 | Exportación | Para todos los indicadores: poder sacar **base bruta a Excel**. | MUST | Admin | Export Excel |  |
| RQ-089 | Estadística | Además del Excel, poder extraer estadística: **promedio** y una “campana” (se menciona “campana Gautama”, a confirmar como término exacto). | SHOULD | Admin | Cálculos estadísticos |  |
| RQ-090 | Reportes | Debe poderse **descargar**/extraer los indicadores desde reportes. | SHOULD | Admin | Export |  |

---

**M) Chatbot (extra)**

| ID | Módulo | Requerimiento | Prioridad | Roles | Dependencias | Fuente |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| RQ-091 | Chatbot | Chatbot con **Código del Trabajo cargado** (se menciona como “súper importante”). | LATER | Admin/Usuario | LLM/KB |  |
| RQ-092 | Chatbot | Controlar **tokens/costo** (“regular los tokens… si no, te come los tokens del servidor”). | MUST | Admin | Observabilidad/costos |  |
| RQ-093 | Chatbot | Disponibilidad: se conversa que **puede quedar para admins**. | SHOULD | Admin | Permisos |  |

---

**Puntos que quedaron explícitamente “a definir” (sin inventar nada)**

1. **Regla final de descarga de documentos**: primero se dice que el usuario podría descargar, luego se define que **solo admin**. (Queda **TBD** hasta que lo cierren)  
2. **Histórico de asistencia**: se prefiere “histórico”, pero se menciona riesgo de lentitud si es eterno (implica definir estrategia: paginado/rango por fechas)  
3. **Habilitación de horas compensatorias**: se plantea “desde mañana” vs “mes siguiente”, pero la lógica propuesta queda “mes siguiente” (si quieren otra regla, hay que cerrarla)

Si quieres, en el siguiente paso puedo convertir esta matriz en **backlog listo para Jira/Trello** (épicas → historias → criterios de aceptación), manteniendo los mismos IDs.

 

