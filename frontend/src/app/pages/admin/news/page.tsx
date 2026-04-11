"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React from "react";
import { Plus } from "lucide-react";
import { GoldButton } from "../../../../components/ui/GoldButton";
import NewsFormCard from "./components/NewsFormCard";
import NewsListGrid from "./components/NewsListGrid";
import { inputStyle, useAdminNewsForm } from "./components/useAdminNewsForm";

export default function AdminNewsPage() {
  const {
    newsList,
    showForm,
    editId,
    isSaving,
    formError,
    form,
    setForm,
    resetForm,
    openCreateForm,
    handleSave,
    handleEdit,
    handleDelete,
    handleCoverImageChange,
  } = useAdminNewsForm();

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
            Kelola Berita
          </h1>
          <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
            Editor berita menggunakan TinyMCE. Gambar dan tata letak konten diatur langsung di editor.
          </p>
        </div>
        <GoldButton variant="primary" size="sm" onClick={openCreateForm}>
          <Plus size={14} />
          Tambah Berita
        </GoldButton>
      </div>

      {showForm ? (
        <NewsFormCard
          editId={editId}
          form={form}
          formError={formError}
          isSaving={isSaving}
          inputStyle={inputStyle}
          setForm={setForm}
          handleCoverImageChange={handleCoverImageChange}
          handleSave={handleSave}
          resetForm={resetForm}
        />
      ) : null}

      <NewsListGrid newsList={newsList} handleEdit={handleEdit} handleDelete={handleDelete} />
    </div>
  );
}

