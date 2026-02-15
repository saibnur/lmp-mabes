'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Camera,
  CreditCard,
  MapPin,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirebaseAuth } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useUserProfile } from '@/components/dashboard/UserProfileProvider';
import { memberApi, mediaApi } from '@/lib/api';
import Toast from '@/components/Toast';

interface Region {
  id: string;
  name: string;
}

export default function EditProfilPage() {
  const router = useRouter();
  const { profile, loading: profileLoading, providerId } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  // Form State
  const [formData, setFormData] = useState({
    displayName: '',
    nik: '',
    email: '',
    photoURL: '',
    ktpURL: '',
  });

  // Organization / Region State
  const [regions, setRegions] = useState<{
    provinces: Region[];
    regencies: Region[];
    districts: Region[];
    villages: Region[];
  }>({
    provinces: [],
    regencies: [],
    districts: [],
    villages: [],
  });

  const [selection, setSelection] = useState({
    provinceId: '',
    regencyId: '',
    districtId: '',
    villageId: '',
  });

  const [selectionNames, setSelectionNames] = useState({
    provinceName: '',
    regencyName: '',
    districtName: '',
    villageName: '',
  });

  // Media State
  const [previews, setPreviews] = useState({
    photo: '',
    ktp: '',
  });
  const [files, setFiles] = useState<{ photo: File | null; ktp: File | null }>({
    photo: null,
    ktp: null,
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);

  // Initialize data
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        nik: profile.nik || '',
        email: profile.email || '',
        photoURL: profile.photoURL || '',
        ktpURL: profile.ktpURL || '',
      });
      setPreviews({
        photo: profile.photoURL || '',
        ktp: profile.ktpURL || '',
      });

      if (profile.organization) {
        setSelection({
          provinceId: profile.organization.province_id || '',
          regencyId: profile.organization.regency_id || '',
          districtId: profile.organization.district_id || '',
          villageId: profile.organization.village_id || '',
        });
        setSelectionNames({
          provinceName: profile.organization.province_name || '',
          regencyName: profile.organization.regency_name || '',
          districtName: profile.organization.district_name || '',
          villageName: profile.organization.village_name || '',
        });
      }
      setInitialLoading(false);
    }
  }, [profile]);

  // Fetch Provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const { data } = await memberApi.getRegions('provinces');
        if (data.success) {
          setRegions(prev => ({ ...prev, provinces: data.data }));
        }
      } catch (error) {
        console.error('Fetch provinces error:', error);
      }
    };
    fetchProvinces();
  }, []);

  // Cascading Fetch
  useEffect(() => {
    if (selection.provinceId) {
      const fetchRegencies = async () => {
        try {
          const { data } = await memberApi.getRegions('regencies', selection.provinceId);
          if (data.success) {
            setRegions(prev => ({ ...prev, regencies: data.data }));
          }
        } catch (error) {
          console.error('Fetch regencies error:', error);
        }
      };
      fetchRegencies();
    } else {
      setRegions(prev => ({ ...prev, regencies: [], districts: [], villages: [] }));
    }
  }, [selection.provinceId]);

  useEffect(() => {
    if (selection.regencyId) {
      const fetchDistricts = async () => {
        try {
          const { data } = await memberApi.getRegions('districts', selection.regencyId);
          if (data.success) {
            setRegions(prev => ({ ...prev, districts: data.data }));
          }
        } catch (error) {
          console.error('Fetch districts error:', error);
        }
      };
      fetchDistricts();
    } else {
      setRegions(prev => ({ ...prev, districts: [], villages: [] }));
    }
  }, [selection.regencyId]);

  useEffect(() => {
    if (selection.districtId) {
      const fetchVillages = async () => {
        try {
          const { data } = await memberApi.getRegions('villages', selection.districtId);
          if (data.success) {
            setRegions(prev => ({ ...prev, villages: data.data }));
          }
        } catch (error) {
          console.error('Fetch villages error:', error);
        }
      };
      fetchVillages();
    } else {
      setRegions(prev => ({ ...prev, villages: [] }));
    }
  }, [selection.districtId]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'ktp') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFiles(prev => ({ ...prev, [type]: file }));
      setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  const handleSave = async () => {
    // Basic Validation
    if (formData.nik && formData.nik.length !== 16) {
      setToast({ show: true, message: 'NIK harus berjumlah 16 digit.', type: 'error' });
      return;
    }

    setLoading(true);
    const auth = getFirebaseAuth();
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const idToken = await user.getIdToken();
      let finalPhotoURL = formData.photoURL;
      let finalKtpURL = formData.ktpURL;

      // Upload if files changed
      if (files.photo) {
        const { data: signRes } = await mediaApi.getSignUpload(idToken, 'profiles');
        if (signRes.success) {
          finalPhotoURL = await uploadToCloudinary(files.photo, 'profiles', signRes);
        }
      }
      if (files.ktp) {
        const { data: signRes } = await mediaApi.getSignUpload(idToken, 'ktp');
        if (signRes.success) {
          finalKtpURL = await uploadToCloudinary(files.ktp, 'ktp', signRes);
        }
      }

      // Hit Backend API for Profile Update and KTA Generation
      const { data: updateRes } = await memberApi.updateProfile(idToken, {
        fullName: formData.displayName,
        nik: formData.nik,
        email: formData.email,
        phoneNumber: profile?.phoneNumber || '',
        organization: {
          province_id: selection.provinceId,
          province_name: selectionNames.provinceName,
          regency_id: selection.regencyId,
          regency_name: selectionNames.regencyName,
          district_id: selection.districtId,
          district_name: selectionNames.districtName,
          village_id: selection.villageId,
          village_name: selectionNames.villageName,
        },
        photoURL: finalPhotoURL,
        ktpURL: finalKtpURL,
      });

      if (updateRes.success) {
        // Sync local auth profile
        await updateProfile(user, {
          displayName: formData.displayName,
          photoURL: finalPhotoURL,
        });

        setToast({ show: true, message: 'Profil berhasil diperbarui!', type: 'success' });
        setTimeout(() => {
          router.replace('/dashboard');
        }, 1500);
      } else {
        throw new Error(updateRes.message || 'Gagal update profil');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setToast({
        show: true,
        message: error.response?.data?.message || error.message || 'Gagal menyimpan profil.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const isEmailReadOnly = providerId === 'password';

  if (initialLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white p-6 md:p-10 mb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl space-y-10"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-slate-900 pb-10">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter italic">
              Edit <span className="text-red-600">Profil</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Lengkapi identitas resmi organisasi</p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full md:w-auto flex items-center justify-center gap-3 rounded-2xl bg-red-600 px-10 py-5 font-black text-lg text-white hover:bg-slate-900 transition shadow-xl shadow-red-200 disabled:opacity-50 active:scale-95"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-6 w-6" /> SIMPAN PERUBAHAN</>}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Media & Identity */}
          <div className="space-y-8">
            {/* Foto Profil */}
            <div className="rounded-[2.5rem] border-2 border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
              <h2 className="mb-6 text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Camera className="w-4 h-4" /> Foto Profil
              </h2>
              <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-slate-900 shadow-2xl relative">
                    {previews.photo ? (
                      <img src={previews.photo} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                        <User className="h-16 w-16" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute bottom-1 right-1 h-10 w-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition cursor-pointer border-2 border-white"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    ref={photoInputRef}
                    hidden
                    accept="image/*"
                    onChange={(e) => handleMediaChange(e, 'photo')}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-500 italic max-w-xs">
                    "Gunakan seragam atau pakaian rapi dengan background polos untuk foto KTA."
                  </p>
                </div>
              </div>
            </div>

            {/* Identitas */}
            <div className="rounded-[2.5rem] border-2 border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 space-y-6">
              <h2 className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Data Diri
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">NIK (Nomor Induk Kependudukan)</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                    placeholder="Wajib 16 Digit"
                    className="w-full rounded-2xl bg-slate-50 border-2 border-slate-100 px-5 py-4 font-black outline-none focus:border-red-600 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Sesuai KTP"
                    className="w-full rounded-2xl bg-slate-50 border-2 border-slate-100 px-5 py-4 font-black outline-none focus:border-red-600 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Alamat Email {isEmailReadOnly && '(Permanen)'}</label>
                  <input
                    type="email"
                    value={formData.email}
                    readOnly={isEmailReadOnly}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contoh@email.com"
                    className={`w-full rounded-2xl border-2 px-5 py-4 font-black outline-none transition ${isEmailReadOnly ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:border-red-600'}`}
                  />
                </div>
              </div>
            </div>

            {/* Foto KTP */}
            <div className="rounded-[2.5rem] border-2 border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
              <h2 className="mb-6 text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Unggah Foto KTP
              </h2>
              <div
                onClick={() => ktpInputRef.current?.click()}
                className="relative h-48 w-full border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-red-600 transition group overflow-hidden"
              >
                {previews.ktp ? (
                  <img src={previews.ktp} alt="KTP Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud className="h-10 w-10 text-slate-300 group-hover:text-red-600 transform group-hover:-translate-y-1 transition" />
                    <p className="text-xs font-bold text-slate-400">Klik untuk unggah atau seret file</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={ktpInputRef}
                  hidden
                  accept="image/*"
                  onChange={(e) => handleMediaChange(e, 'ktp')}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Organization */}
          <div className="space-y-8">
            <div className="rounded-[2.5rem] border-2 border-slate-900 bg-white p-8 shadow-xl shadow-slate-200/50 space-y-8 h-fit">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Struktur Organisasi
                </h2>
                <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-200 transform rotate-12">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Provinsi</label>
                  <select
                    value={selection.provinceId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const name = regions.provinces.find(p => p.id === id)?.name || '';
                      setSelection({ provinceId: id, regencyId: '', districtId: '', villageId: '' });
                      setSelectionNames({ provinceName: name, regencyName: '', districtName: '', villageName: '' });
                    }}
                    className="w-full rounded-2xl bg-slate-50 border-2 border-slate-100 px-5 py-4 font-black outline-none focus:border-red-600 appearance-none transition"
                  >
                    <option value="">Pilih Provinsi</option>
                    {regions.provinces.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Kabupaten / Kota</label>
                  <select
                    disabled={!selection.provinceId}
                    value={selection.regencyId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const name = regions.regencies.find(p => p.id === id)?.name || '';
                      setSelection(prev => ({ ...prev, regencyId: id, districtId: '', villageId: '' }));
                      setSelectionNames(prev => ({ ...prev, regencyName: name, districtName: '', villageName: '' }));
                    }}
                    className="w-full rounded-2xl bg-slate-50 border-2 border-slate-100 px-5 py-4 font-black outline-none focus:border-red-600 appearance-none transition disabled:opacity-50"
                  >
                    <option value="">Pilih Kabupaten</option>
                    {regions.regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Kecamatan</label>
                  <select
                    disabled={!selection.regencyId}
                    value={selection.districtId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const name = regions.districts.find(p => p.id === id)?.name || '';
                      setSelection(prev => ({ ...prev, districtId: id, villageId: '' }));
                      setSelectionNames(prev => ({ ...prev, districtName: name, villageName: '' }));
                    }}
                    className="w-full rounded-2xl bg-slate-50 border-2 border-slate-100 px-5 py-4 font-black outline-none focus:border-red-600 appearance-none transition disabled:opacity-50"
                  >
                    <option value="">Pilih Kecamatan</option>
                    {regions.districts.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Desa / Kelurahan</label>
                  <select
                    disabled={!selection.districtId}
                    value={selection.villageId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const name = regions.villages.find(p => p.id === id)?.name || '';
                      setSelection(prev => ({ ...prev, villageId: id }));
                      setSelectionNames(prev => ({ ...prev, villageName: name }));
                    }}
                    className="w-full rounded-2xl bg-slate-50 border-2 border-slate-100 px-5 py-4 font-black outline-none focus:border-red-600 appearance-none transition disabled:opacity-50"
                  >
                    <option value="">Pilih Desa</option>
                    {regions.villages.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                {profile?.no_kta && (
                  <div className="pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Nomor KTA Resmi</label>
                    <div className="text-2xl font-black text-slate-900 tracking-tighter italic">
                      {profile.no_kta}
                    </div>
                  </div>
                )}

                <div className="rounded-3xl bg-red-50 p-6 border-2 border-red-100 mt-8">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-black text-red-600 uppercase tracking-tighter">Info Penomoran KTA</span>
                  </div>
                  <p className="text-xs font-bold text-red-700/70 leading-relaxed italic">
                    Nomor KTA akan digenerate secara otomatis berdasarkan kode wilayah Desa/Kelurahan yang Anda pilih. Pastikan data wilayah sudah benar sebelum menyimpan.
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Status info */}
            <div className="p-8 rounded-[2rem] bg-slate-50 border-2 border-slate-100 italic space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-widest">
                <AlertCircle className="w-4 h-4" /> Kebijakan Data
              </div>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Data yang Anda simpan akan digunakan untuk pencetakan Kartu Tanda Anggota (KTA) resmi Laskar Merah Putih. Segala bentuk pemalsuan data identitas dapat berakibat pada pencabutan keanggotaan.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <Toast
        message={toast.message}
        visible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
