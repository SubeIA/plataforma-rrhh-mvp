/**
 * Calculator for Daily Attendance based on HXM Rules
 */

export function calculateDailyAttendance(entryTimeISO, exitTimeISO) {
    const entryTime = new Date(entryTimeISO);
    const exitTime = new Date(exitTimeISO);

    // Reglas:
    // 1. Tope/Truncamiento: Las marcas previas a 08:00 no gatillan salida temprana.
    // O sea, si entra antes de las 08:00, para cálculos se asumen las 08:00
    const entryHours = entryTime.getHours();
    const entryMinutes = entryTime.getMinutes();

    let effectiveEntry = new Date(entryTime);
    if (entryHours < 8) {
        effectiveEntry.setHours(8, 0, 0, 0);
    }

    // 2. Atraso: Ventana hasta 10:00. Atraso a partir de los 15 minutos (10:15)
    let lateMinutes = 0;
    const windowEnd = new Date(entryTime);
    windowEnd.setHours(10, 0, 0, 0);

    // Si la entrada efectiva es después de las 10:15
    if (effectiveEntry > windowEnd) {
        const diffMs = effectiveEntry.getTime() - windowEnd.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins >= 15) {
            lateMinutes = diffMins;
        }
    }

    // 3. Colación: Descuento autónomo de 1 hr en la liquidación diaria
    // 4. Cálculo de horas extra (> 60 min de 9 horas en total si jornada es 8 de trabajo)
    const totalMs = exitTime.getTime() - effectiveEntry.getTime();
    let totalMinutes = Math.floor(totalMs / 60000); // minutos totales presenciales

    // Descuento de colación fijo (60 min) siempre que haya estado más de 5 hrs trabajando
    if (totalMinutes > 300) {
        totalMinutes -= 60;
    }

    const calculatedWorkHours = Math.max(0, totalMinutes / 60);

    // Si asume jornada de 8 horas netas (40h semanales), lo que exceda de 8 horas:
    // Pero la regla habla de "Horas extra -> compensatorias solo si superan 60 min desde hora de salida"
    // Jornada neta objetivo = 8 horas (o 9 presenciales)
    let extraMinutes = 0;
    if (calculatedWorkHours > 9) { // 9 horas trabajadas descontando colación = 10 hrs presenciales
        extraMinutes = Math.floor((calculatedWorkHours - 9) * 60);
    }

    return {
        calculatedWorkHours,
        lateMinutes,
        extraMinutes
    };
}
