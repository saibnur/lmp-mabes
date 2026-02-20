'use client';

import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Users, ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { useState, useMemo } from 'react';

interface OrgUnit {
    name: string;
    position: string;
    children?: OrgUnit[];
}

const orgStructure: OrgUnit[] = [
    {
        name: 'H. Muhammad Arsyad Cannu',
        position: 'Ketua Umum',
        children: [
            {
                name: 'H. Wahyu Wibisana, SE',
                position: 'Ketua Harian',
            },
            {
                name: 'Wakil Ketua Umum',
                position: 'Wakil Ketua',
                children: [
                    { name: 'Burhan Saidi Chaniago, SH', position: 'Bidang Organisasi, Kaderisasi dan Keanggotan' },
                    { name: 'Dylan Nathannael', position: 'Bidang Luar Negeri' },
                    { name: 'Sang Putu Mahardika', position: 'Bidang Dalam Negeri' },
                    { name: 'H. Junaedi, S.H., M.H.', position: 'Bidang Pertahanan' },
                    { name: 'Iwan Djoemarwan', position: 'Bidang Keuangan' },
                    { name: 'Saut Tulus Leonard Situmorang, S.H., M.H.', position: 'Bidang Hukum' },
                    { name: 'Dr. H. Razman Arif Nasution, S.H., S.Ag., MA., Ph.D.', position: 'Bidang Hak Asasi Manusia' },
                    { name: 'Tan Kun Liang, S.H., M.H.', position: 'Bidang Imigrasi dan Pemasyarakatan' },
                    { name: 'Jun Fi, S.H., CLA., CLI., CTA', position: 'Bidang Perencanaan Pembangunan Nasional/Kepala Bappenas' },
                    { name: 'Arni, M.M.', position: 'Bidang Pendidikan Dasar dan Menengah' },
                    { name: 'Lukmanul Hakim, S.Si., S.H.', position: 'Bidang Pendidikan Tinggi, Sains, dan Teknologi' },
                    { name: 'Yunithia Samsudin, S.Sn.', position: 'Bidang Kebudayaan' },
                    { name: 'Rani Ventaria', position: 'Bidang Sosial' },
                    { name: 'Zuardi, S.E., S.H., C.Med.', position: 'Bidang Ketenagakerjaan' },
                    { name: 'H. Nanang Syaiful Ghozi, SHI, M.H', position: 'Bidang Perlindungan Pekerja Migran Indonesia' },
                    { name: 'Ir. Ahmad Tastari, MM., IPM.', position: 'Bidang Perindustrian' },
                    { name: 'Ukur Purba, S.T.', position: 'Bidang Perdagangan' },
                    { name: 'Andi Irwan Nurdin Karumpa', position: 'Bidang Energi dan Sumber Daya Mineral' },
                    { name: 'Mardjulis Noer', position: 'Bidang Pekerjaan Umum' },
                    { name: 'Fitria Anggoen Yusuf Gulam', position: 'Bidang Perumahan dan Kawasan Permukiman' },
                    { name: 'M. Teddy Arisandi', position: 'Bidang Desa dan Pembangunan Daerah Tertinggal' },
                    { name: 'Muhammad Fauzie Dianjaya', position: 'Bidang Transmigrasi' },
                    { name: 'Richard Simanjuntak', position: 'Bidang Ekonomi Kreatif/Kepala Badan Ekraf' },
                    { name: 'Syamsul Arifin', position: 'Bidang Komunikasi dan Digital' },
                    { name: 'Clara Nathalia', position: 'Bidang Pertanian' },
                    { name: 'Hadiman Nainggolan, S.H.', position: 'Bidang Perhubungan' },
                    { name: 'Luthfi Ihsana Nur M', position: 'Bidang Kehutanan' },
                    { name: 'Daeng Rais', position: 'Bidang Kelautan dan Perikanan' },
                    { name: 'Ical Syamsudin', position: 'Bidang Agraria dan Tata Ruang/BPN' },
                    { name: 'Ir. H. Muhammad Adam, M.T.', position: 'Bidang Pendayagunaan Aparatur Negara dan Reformasi Birokrasi' },
                    { name: 'Yudiansyah', position: 'Bidang Badan Usaha Milik Negara' },
                    { name: 'Yoga Ramadani, S.Kom', position: 'Bidang Kependudukan dan Pembangunan Keluarga/Kepala BKKBN' },
                    { name: 'Rusdi Legowo', position: 'Bidang Lingkungan Hidup/Kepala Badan Pengendalian LH' },
                    { name: 'H. M. Husni Tamrin', position: 'Bidang Investasi dan Hilirisasi/Kepala BKPM' },
                    { name: 'Robert Lim', position: 'Bidang Koperasi' },
                    { name: 'Drs. Abdul Kadir Cawidu', position: 'Bidang Menteri Usaha Mikro dan Kecil Menengah' },
                    { name: 'Revani Dina Fitra, S.E., S.H., CPM.', position: 'Bidang Pariwisata' },
                    { name: 'Titin Supriatin', position: 'Bidang Pemberdayaan Perempuan dan Perlindungan Anak' },
                    { name: 'Sophan Lamara', position: 'Bidang Pemuda dan Olahraga' },
                    { name: 'Iwan Avent', position: 'Bidang Perpajakan' },
                ],
            },
            {
                name: 'Dr. Abdul Rachman Thaha, S.H., M.H.',
                position: 'Sekretaris Jenderal',
                children: [
                    { name: 'Herwin Fatahudin, S.Sn.', position: 'Wakil Sekretaris Jenderal' },
                    { name: 'Adrie Charviandi, S.E., M.M.', position: 'Wakil Sekretaris Jenderal' },
                    { name: 'Awang Darmawan, SH', position: 'Wakil Sekretaris Jenderal' },
                    { name: 'Yunus Rotestu Sakuain, S.H., S.E., M.H., CPLA', position: 'Wakil Sekretaris Jenderal' },
                    { name: 'Dr (C) Bagza Pratama, M.Sos., C.STPI', position: 'Wakil Sekretaris Jenderal' },
                ],
            },
            {
                name: 'H. Surianto AM., S.Ag., M.M.',
                position: 'Bendahara Umum',
                children: [
                    { name: 'H. Muhammad Yasir', position: 'Wakil Bendahara Umum' },
                    { name: 'Salomo David Tambunan', position: 'Wakil Bendahara Umum' },
                    { name: 'H. Abd. Hakim Rauf, S.Ip., SH', position: 'Wakil Bendahara Umum' },
                    { name: 'Johnsun', position: 'Wakil Bendahara Umum' },
                    { name: 'Stefanus Ferdinand Kapoh', position: 'Wakil Bendahara Umum' },
                    { name: 'Khairul Azmy', position: 'Wakil Bendahara Umum' },
                ],
            },
            {
                name: 'Logo Vallenberg',
                position: 'Panglima',
                children: [
                    { name: 'Idham Annas, S.Sos', position: 'Wakil Panglima' },
                    { name: 'Irvan', position: 'Kepala Staf' },
                    { name: 'Yusuf', position: 'Wakil Kepala Staf' },
                    { name: 'Rudi Jaidun', position: 'Wakil Kepala Staf' },
                    { name: 'Dika Tjipta Wibisana, S.Kom., S.E.', position: 'Komandan Provost' },
                    { name: 'R. M. Harya Adhi', position: 'Wakil Komandan Provost' },
                    { name: 'Sudirman Tuan Nuntung', position: 'Komandan Brigade 17' },
                    { name: 'Richard Gosseling', position: 'Wakil Komandan Brigade 17' },
                    { name: 'Adibu Ledde', position: 'Komandan Detasemen Khusus' },
                    { name: 'David Candra', position: 'Wakil Komandan Detasemen Khusus' },
                ],
            },
            {
                name: 'Kumalasari Mukhlisah',
                position: 'Ketua Srikandi',
                children: [
                    { name: 'Herlita', position: 'Wakil Ketua Srikandi' },
                ],
            },
            {
                name: 'Susandi, S.H., M.H.',
                position: 'Ketua Lembaga Bantuan Hukum dan Advokasi',
            },
        ],
    },
];

// Fungsi untuk mengumpulkan semua anggota dari struktur
const getAllMembers = (units: OrgUnit[]): OrgUnit[] => {
    const members: OrgUnit[] = [];

    const traverse = (unit: OrgUnit) => {
        // Tambahkan unit saat ini kecuali yang generic seperti "Wakil Ketua Umum"
        if (!unit.name.includes('Wakil Ketua Umum') || unit.children) {
            members.push(unit);
        }

        // Traverse children
        if (unit.children) {
            unit.children.forEach(child => traverse(child));
        }
    };

    units.forEach(unit => traverse(unit));
    return members;
};

const OrgNode = ({
    unit,
    level = 0,
    searchQuery = '',
    onNodeClick
}: {
    unit: OrgUnit;
    level?: number;
    searchQuery?: string;
    onNodeClick?: (unit: OrgUnit) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(level < 2);
    const hasChildren = unit.children && unit.children.length > 0;

    // Cek apakah node ini atau children-nya match dengan search query
    const isMatchingSearch = useMemo(() => {
        if (!searchQuery) return false;

        const query = searchQuery.toLowerCase();
        const nameMatch = unit.name.toLowerCase().includes(query);
        const positionMatch = unit.position.toLowerCase().includes(query);

        return nameMatch || positionMatch;
    }, [unit, searchQuery]);

    // Cek apakah ada children yang match
    const hasMatchingChildren = useMemo(() => {
        if (!searchQuery || !hasChildren) return false;

        const checkChildren = (children: OrgUnit[]): boolean => {
            return children.some(child => {
                const query = searchQuery.toLowerCase();
                const match = child.name.toLowerCase().includes(query) ||
                    child.position.toLowerCase().includes(query);

                if (match) return true;
                if (child.children) return checkChildren(child.children);
                return false;
            });
        };

        return checkChildren(unit.children!);
    }, [unit, searchQuery, hasChildren]);

    // Auto-expand jika ada search query dan node ini atau children-nya match
    const shouldExpand = searchQuery && (isMatchingSearch || hasMatchingChildren);

    const bgColor = level === 0
        ? 'bg-red-600 text-white'
        : level === 1
            ? 'bg-slate-100 text-slate-900'
            : 'bg-white border border-slate-200';

    const highlightClass = isMatchingSearch ? 'ring-2 ring-yellow-400 bg-yellow-50' : '';

    return (
        <div className="mb-4">
            <div
                className={`rounded-lg p-4 ${bgColor} ${highlightClass} ${hasChildren ? 'cursor-pointer' : ''} transition-all hover:shadow-md`}
                onClick={() => {
                    if (hasChildren) {
                        setIsExpanded(!isExpanded);
                    }
                    if (onNodeClick) {
                        onNodeClick(unit);
                    }
                }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${level === 0 ? 'bg-white/20' : 'bg-red-600/10'
                            }`}>
                            <Users className={level === 0 ? 'text-white' : 'text-red-600'} size={20} />
                        </div>
                        <div>
                            <p className={`font-bold ${level === 0 ? 'text-lg' : ''}`}>
                                {unit.name}
                            </p>
                            <p className={`text-sm ${level === 0 ? 'text-white/80' : 'text-slate-500'
                                }`}>
                                {unit.position}
                            </p>
                        </div>
                    </div>
                    {hasChildren && (
                        (isExpanded || shouldExpand) ? <ChevronDown size={20} /> : <ChevronRight size={20} />
                    )}
                </div>
            </div>

            {hasChildren && (isExpanded || shouldExpand) && (
                <div className="ml-6 mt-4 pl-4 border-l-2 border-red-600/30">
                    {unit.children!.map((child, index) => (
                        <OrgNode
                            key={index}
                            unit={child}
                            level={level + 1}
                            searchQuery={searchQuery}
                            onNodeClick={onNodeClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function OrganisasiPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState<OrgUnit | null>(null);

    // Dapatkan semua anggota untuk fitur autocomplete
    const allMembers = useMemo(() => getAllMembers(orgStructure), []);

    // Filter anggota berdasarkan search query
    const filteredMembers = useMemo(() => {
        if (!searchQuery) return [];

        const query = searchQuery.toLowerCase();
        return allMembers.filter(member =>
            member.name.toLowerCase().includes(query) ||
            member.position.toLowerCase().includes(query)
        ).slice(0, 10); // Batasi 10 hasil untuk performa
    }, [searchQuery, allMembers]);

    const handleClearSearch = () => {
        setSearchQuery('');
        setSelectedMember(null);
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-20 bg-slate-50">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Struktur Organisasi
                    </h1>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                        Susunan kepengurusan Markas Besar Laskar Merah Putih periode 2025-2030
                    </p>
                    <div className="mx-auto mt-6 h-1 w-24 bg-red-600" />
                </div>
            </section>

            {/* Search Section */}
            <section className="py-8 bg-white sticky top-16 z-40 shadow-sm border-b border-slate-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama anggota atau jabatan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-600/10 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {searchQuery && filteredMembers.length > 0 && (
                            <div className="absolute mt-2 w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl max-h-96 overflow-y-auto z-50">
                                <div className="p-2">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
                                        Ditemukan {filteredMembers.length} hasil{filteredMembers.length === 10 ? '+' : ''}
                                    </p>
                                    {filteredMembers.map((member, index) => (
                                        <div
                                            key={index}
                                            onClick={() => {
                                                setSelectedMember(member);
                                                setSearchQuery(member.name);
                                            }}
                                            className="px-3 py-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <p className="font-semibold text-slate-900">{member.name}</p>
                                            <p className="text-sm text-slate-500">{member.position}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No Results */}
                        {searchQuery && filteredMembers.length === 0 && (
                            <div className="absolute mt-2 w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50">
                                <p className="text-center text-slate-500">
                                    Tidak ditemukan hasil untuk "{searchQuery}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Structure Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Search Info */}
                        {searchQuery && (
                            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                                <p className="text-sm text-yellow-800">
                                    <strong>Pencarian:</strong> Menampilkan hasil untuk "{searchQuery}"
                                    {filteredMembers.length > 0 && ` - ${filteredMembers.length} anggota ditemukan`}
                                </p>
                            </div>
                        )}

                        {/* Interactive Tree */}
                        {orgStructure.map((unit, index) => (
                            <OrgNode
                                key={index}
                                unit={unit}
                                searchQuery={searchQuery}
                                onNodeClick={setSelectedMember}
                            />
                        ))}

                        {/* Regional Structure Info */}
                        <div className="mt-16 grid md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                                <h3 className="font-bold text-xl mb-4 text-slate-900">Markas Daerah</h3>
                                <p className="text-slate-600 mb-4 leading-relaxed">
                                    Struktur kepengurusan di tingkat provinsi yang mengkoordinasikan seluruh
                                    kegiatan LMP di wilayahnya.
                                </p>
                                <p className="text-red-600 font-bold">38 Provinsi Seluruh Indonesia</p>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                                <h3 className="font-bold text-xl mb-4 text-slate-900">Markas Cabang</h3>
                                <p className="text-slate-600 mb-4 leading-relaxed">
                                    Struktur kepengurusan di tingkat kabupaten/kota yang menjadi garda terdepan
                                    dalam implementasi program.
                                </p>
                                <p className="text-red-600 font-bold">500+ Kabupaten/Kota</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sayap Organisasi */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">Sayap Organisasi</h2>
                        <div className="mx-auto mt-6 h-1 w-24 bg-red-600" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow text-center border border-slate-100">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-red-600 font-bold text-2xl">S</span>
                            </div>
                            <h3 className="font-bold text-xl mb-3 text-slate-900">Srikandi LMP</h3>
                            <p className="text-slate-600">
                                Sayap organisasi perempuan yang aktif dalam pemberdayaan wanita dan kegiatan sosial.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow text-center border border-slate-100">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-red-600 font-bold text-2xl">T</span>
                            </div>
                            <h3 className="font-bold text-xl mb-3 text-slate-900">Taruna LMP</h3>
                            <p className="text-slate-600">
                                Sayap organisasi pemuda yang menjadi motor penggerak regenerasi dan aksi-aksi lapangan.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow text-center border border-slate-100">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-red-600 font-bold text-2xl">P</span>
                            </div>
                            <h3 className="font-bold text-xl mb-3 text-slate-900">Perisai LMP</h3>
                            <p className="text-slate-600">
                                Satuan tugas pengamanan yang bertugas menjaga ketertiban dalam setiap kegiatan organisasi.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
