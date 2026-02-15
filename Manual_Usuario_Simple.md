
# Manual de Usuario: Plataforma de Gestión de Recursos Humanos (RRHH)

¡Bienvenido! Este manual te explicará cómo usar la plataforma de forma sencilla. El sistema tiene dos "caras" principales: una para el **Colaborador (Empleado)** y otra para el **Administrador/RRHH**.

---

## 🔐 1. Ingreso al Sistema (Login)

Para usar la plataforma, primero debes entrar con tu cuenta.
1.  Abre el navegador y ve a la dirección de la plataforma.
2.  Ingresa tu correo electrónico (ej: `usuario@empresa.com`).
3.  Ingresa tu contraseña.
4.  Haz clic en "Iniciar Sesión".

---

## 👤 2. Para Colaboradores (Empleados)

Si eres un empleado, estas son las cosas que puedes hacer:

### A. Marcar Asistencia (Entrada y Salida)
Es lo más importante. Registra cuándo llegas y cuándo te vas.
1.  En la pantalla principal ("Mi Asistencia"), verás dos botones grandes.
2.  **Botón Verde (Marcar Entrada)**: Púlsalo cuando inicies tu jornada.
3.  **Botón Rojo (Marcar Salida)**: Púlsalo cuando termines.
4.  **Ubicación (GPS)**: El sistema te pedirá permiso para usar tu ubicación. Debes aceptarlo, ya que el sistema verifica si estás en la oficina o en un lugar permitido.
    *   *Nota*: Si estás muy lejos de la oficina, el sistema podría avisarte o bloquear la marca (dependiendo de la configuración).

### B. Mis Documentos
Aquí puedes ver y "firmar" digitalmente documentos que te envíe RRHH (como contratos o anexos).
1.  Ve al menú "Mis Documentos".
2.  Verás una lista de archivos PDF.
3.  Si un documento dice **"Pendiente"**, haz clic en él para revisarlo.
4.  Presiona el botón "Firmar" para confirmar que lo leíste y aceptas. El estado cambiará a **"Firmado"** con la fecha y hora.

### C. Solicitudes (Vacaciones y Permisos)
Si necesitas pedir días libres:
1.  Ve al menú "Solicitudes".
2.  Llena el formulario con:
    *   **Tipo**: (Vacaciones, Licencia, Permiso, etc.).
    *   **Fechas**: Desde cuándo hasta cuándo.
    *   **Motivo**: Una breve explicación.
3.  Dale a "Enviar".
4.  Podrás ver una tabla abajo con el estado de tu solicitud (Pendiente, Aprobada o Rechazada).

---

## 👔 3. Para Administradores y RRHH

Si tienes permisos de Administrador o RRHH, tienes acceso a herramientas de gestión.

### A. Gestión de Usuarios
Aquí creas las cuentas para los nuevos empleados.
1.  Ve a "Admin Usuarios".
2.  **Crear Usuario**:
    *   Ingresa el email y una contraseña temporal.
    *   Asigna el **Rol**: `user` (empleado normal), `hr` (RRHH) o `admin`.
    *   Llena los datos del perfil: Nombre completo, RUT, Cargo, Departamento, etc.
3.  **Editar**: Puedes corregir datos de empleados existentes en la lista.

### B. Gestión de Turnos
Define los horarios de trabajo.
1.  Ve a "Gestión Turnos".
2.  **Crear Turno**: Define un nombre (ej: "Mañana 9-18") y la hora de inicio/fin.
3.  **Asignar Turno**: Selecciona un empleado y asígnale ese turno. Esto sirve para calcular si llega tarde.

### C. Revisar Solicitudes
Aprueba o rechaza las vacaciones que pidieron los empleados.
1.  Ve a "Gestión Solicitudes".
2.  Verás una lista de todas las peticiones pendientes.
3.  Haz clic en **"Aprobar"** o **"Rechazar"** según corresponda. Puedes dejar un comentario de respuesta.

### D. Gestión de Asistencia y Reportes
Supervisa quién vino y genera la nómina.
1.  **Corregir Asistencia**: En "Gestión RRHH", puedes ver el historial de todos. Si alguien olvidó marcar, puedes agregar la marca manualmente o corregir la hora.
2.  **Reportes y Nómina (Sueldos)**:
    *   Ve a "Reportes".
    *   Selecciona un rango de fechas (ej: 1 de mes al 30 de mes).
    *   Presiona **"Generar Reporte"**.
    *   Verás una tabla con los Días Trabajados y Horas Totales de cada empleado.
    *   **Exportar**: Presiona el botón verde para descargar un archivo Excel (CSV) con estos datos, listo para usarlo en el pago de sueldos.

### E. Geolocalización (Oficinas)
*(Configuración técnica)*
*   El sistema valida automáticamente si las coordenadas GPS del empleado coinciden con las de la oficina registrada. Si marcan desde su casa (y no es teletrabajo), el sistema lo detecta.

---

**Resumen Rápido:**
*   **Empleado**: Loguearse -> Marcar GPS -> Firmar Papeles -> Pedir Vacaciones.
*   **Jefe/RRHH**: Crear Usuarios -> Asignar Turnos -> Aprobar Vacaciones -> Sacar Reporte Fin de Mes.
