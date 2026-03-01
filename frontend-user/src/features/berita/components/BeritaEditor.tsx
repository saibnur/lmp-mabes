'use client';

import React, { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    ImageIcon,
} from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getFirebaseAuth } from '@/lib/firebase';
import { mediaApi } from '@/lib/api/media.api';

interface BeritaEditorProps {
    content: string;
    onChange: (html: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!editor) {
        return null;
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const auth = getFirebaseAuth();
            const user = auth.currentUser;
            if (!user) throw new Error("Pengguna tidak terautentikasi.");

            const token = await user.getIdToken(true);
            const { data: signRes } = await mediaApi.getSignUpload(token, 'berita/inline');

            if (!signRes.success) throw new Error("Gagal mendapatkan izin unggahan.");

            const url = await uploadToCloudinary(file, 'berita/inline', signRes);

            editor.chain().focus().setImage({ src: url }).run();
        } catch (error) {
            console.error('Error uploading inline image:', error);
            alert('Gagal mengunggah gambar. Pastikan koneksi internet stabil.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2 rounded-t-xl">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-2 rounded-md hover:bg-slate-200 transition ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900 group-hover:none' : 'text-slate-600'
                    }`}
                title="Bold"
            >
                <Bold className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-2 rounded-md hover:bg-slate-200 transition ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : 'text-slate-600'
                    }`}
                title="Italic"
            >
                <Italic className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                disabled={!editor.can().chain().focus().toggleUnderline().run()}
                className={`p-2 rounded-md hover:bg-slate-200 transition ${editor.isActive('underline') ? 'bg-slate-200 text-slate-900' : 'text-slate-600'
                    }`}
                title="Underline"
            >
                <UnderlineIcon className="h-4 w-4" />
            </button>

            <div className="w-px h-6 bg-slate-300 mx-1" />

            {/* Alignments */}
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-2 rounded-md hover:bg-slate-200 transition ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200 text-slate-900' : 'text-slate-600'
                    }`}
                title="Align Left"
            >
                <AlignLeft className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-2 rounded-md hover:bg-slate-200 transition ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200 text-slate-900' : 'text-slate-600'
                    }`}
                title="Align Center"
            >
                <AlignCenter className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-2 rounded-md hover:bg-slate-200 transition ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200 text-slate-900' : 'text-slate-600'
                    }`}
                title="Align Right"
            >
                <AlignRight className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={`p-2 rounded-md hover:bg-slate-200 transition ${editor.isActive({ textAlign: 'justify' }) ? 'bg-slate-200 text-slate-900' : 'text-slate-600'
                    }`}
                title="Justify"
            >
                <AlignJustify className="h-4 w-4" />
            </button>

            <div className="w-px h-6 bg-slate-300 mx-1" />

            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2 rounded-md hover:bg-slate-200 transition text-slate-600 flex items-center gap-2"
                title="Insert Image"
            >
                {isUploading ? (
                    <div className="h-4 w-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                ) : (
                    <ImageIcon className="h-4 w-4" />
                )}
            </button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />
        </div>
    );
};

export default function BeritaEditor({ content, onChange }: BeritaEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
                defaultAlignment: 'left',
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none min-h-[400px] p-6 focus:outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 transition-all">
            <MenuBar editor={editor} />
            <div className="bg-white">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
