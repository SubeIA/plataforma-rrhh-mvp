import dynamic from 'next/dynamic';

// Cargamos el componente interactivo solo en el cliente para evitar
// errores de hidratación React #418/#423 causados por estado del formulario,
// atributos `disabled` dinámicos y renderizado condicional basado en estado.
const RequestsClient = dynamic(() => import('./RequestsClient'), { ssr: false });

export default function RequestsDashboardPage() {
    return <RequestsClient />;
}
