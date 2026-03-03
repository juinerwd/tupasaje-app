/**
 * Lista de departamentos y ciudades de Colombia para la selección en el perfil.
 */
export const COLOMBIA_LOCATIONS = [
    {
        department: 'Amazonas',
        cities: ['Leticia', 'Puerto Nariño']
    },
    {
        department: 'Antioquia',
        cities: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Rionegro', 'Turbo', 'Caucasia', 'Chigorodó', 'Sabaneta', 'Copacabana', 'La Estrella', 'Girardota', 'Caldas', 'Guarne', 'Marinilla', 'Carepa']
    },
    {
        department: 'Arauca',
        cities: ['Arauca', 'Tame', 'Saravena', 'Arauquita']
    },
    {
        department: 'Atlántico',
        cities: ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Baranoa', 'Palmar de Varela', 'Puerto Colombia', 'Santo Tomás', 'Galapa']
    },
    {
        department: 'Bolívar',
        cities: ['Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar', 'Mompós']
    },
    {
        department: 'Boyacá',
        cities: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Puerto Boyacá', 'Paipa']
    },
    {
        department: 'Caldas',
        cities: ['Manizales', 'La Dorada', 'Chinchiná', 'Villamaría', 'Anserma']
    },
    {
        department: 'Caquetá',
        cities: ['Florencia', 'San Vicente del Caguán', 'Puerto Rico']
    },
    {
        department: 'Casanare',
        cities: ['Yopal', 'Aguazul', 'Villanueva', 'Paz de Ariporo']
    },
    {
        department: 'Cauca',
        cities: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Piendamó']
    },
    {
        department: 'Cesar',
        cities: ['Valledupar', 'Aguachica', 'Agustín Codazzi', 'Bosconia', 'El Paso']
    },
    {
        department: 'Chocó',
        cities: ['Quibdó', 'Istmina', 'Condoto', 'El Carmen de Atrato']
    },
    {
        department: 'Córdoba',
        cities: ['Montería', 'Cereté', 'Sahagún', 'Lorica', 'Montelíbano', 'Planeta Rica', 'Tierralta']
    },
    {
        department: 'Cundinamarca',
        cities: ['Bogotá', 'Soacha', 'Fusagasugá', 'Facatativá', 'Chía', 'Zipaquirá', 'Girardot', 'Mosquera', 'Madrid', 'Funza', 'Cajicá', 'Sibaté', 'Tocancipá', 'Ubaté']
    },
    {
        department: 'Guainía',
        cities: ['Inírida']
    },
    {
        department: 'Guaviare',
        cities: ['San José del Guaviare', 'El Retorno']
    },
    {
        department: 'Huila',
        cities: ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre']
    },
    {
        department: 'La Guajira',
        cities: ['Riohacha', 'Maicao', 'Uribia', 'Manaure', 'San Juan del Cesar', 'Fonseca']
    },
    {
        department: 'Magdalena',
        cities: ['Santa Marta', 'Ciénaga', 'Fundación', 'El Banco', 'Plato', 'Aracataca']
    },
    {
        department: 'Meta',
        cities: ['Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'Puerto Gaitán']
    },
    {
        department: 'Nariño',
        cities: ['Pasto', 'Tumaco', 'Ipiales', 'Túquerres', 'La Unión']
    },
    {
        department: 'Norte de Santander',
        cities: ['Cúcuta', 'Ocaña', 'Villa del Rosario', 'Los Patios', 'Pamplona', 'Tibú']
    },
    {
        department: 'Putumayo',
        cities: ['Mocoa', 'Puerto Asís', 'Valle del Gamuez', 'Orito']
    },
    {
        department: 'Quindío',
        cities: ['Armenia', 'Calarcá', 'La Tebaida', 'Montenegro', 'Quimbaya']
    },
    {
        department: 'Risaralda',
        cities: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia', 'Belén de Umbría']
    },
    {
        department: 'San Andrés y Providencia',
        cities: ['San Andrés', 'Providencia']
    },
    {
        department: 'Santander',
        cities: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil', 'Socorro', 'Cimitarra']
    },
    {
        department: 'Sucre',
        cities: ['Sincelejo', 'Corozal', 'San Marcos', 'Sampués', 'San Onofre', 'Tolú']
    },
    {
        department: 'Tolima',
        cities: ['Ibagué', 'Espinal', 'Melgar', 'Chaparral', 'Líbano', 'Mariquita', 'Honda']
    },
    {
        department: 'Valle del Cauca',
        cities: ['Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Yumbo', 'Cartago', 'Buga', 'Jamundí', 'Florida', 'Pradera', 'Sevilla']
    },
    {
        department: 'Vaupés',
        cities: ['Mitú']
    },
    {
        department: 'Vichada',
        cities: ['Puerto Carreño', 'La Primavera']
    }
];

export const DEPARTMENTS = COLOMBIA_LOCATIONS.map(loc => loc.department).sort();

export const getCitiesByDepartment = (department: string): string[] => {
    const loc = COLOMBIA_LOCATIONS.find(l => l.department === department);
    return loc ? loc.cities.sort() : [];
};
