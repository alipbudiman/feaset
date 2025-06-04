import React from "react";

const roles = [
  { value: "", label: "-- Pilih role anda --" },
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
];

function FormLabelInput({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label
        htmlFor={name}
        style={{
          display: "block",
          fontSize: 17,
          fontWeight: 400,
          marginBottom: 2
        }}
      >
        {label}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          border: "none",
          background: "#D9D9D9",
          fontSize: 17,
          outline: "none"
        }}
        required
      />
    </div>
  );
}

interface FormTambahAnggotaProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function FormTambahAnggota({ onClose, onSubmit }: FormTambahAnggotaProps) {
  return (
    <div
      style={{
        width: 430,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
        padding: 0,
        fontFamily: "inherit",
        position: "relative"
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#4E71FF",
          color: "white",
          fontWeight: "bold",
          fontSize: 28,
          textAlign: "center",
          padding: "16px 0 10px",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          position: "relative"
        }}
      >
        Form Tambah Anggota
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 18,
            background: "none",
            border: "none",
            fontSize: 32,
            color: "#222",
            cursor: "pointer",
            lineHeight: 1
          }}
          aria-label="Close"
          type="button"
        >
          &times;
        </button>
      </div>
      <form
        style={{
          padding: "0 16px 16px 16px",
          marginTop: 4
        }}
        onSubmit={onSubmit}
      >
        <FormLabelInput label="Nama" name="nama" />
        <FormLabelInput label="Username" name="username" />
        <FormLabelInput label="Password" name="password" type="password" />
        <FormLabelInput label="Konfirmasi password" name="konfirmasi_password" type="password" />
        <FormLabelInput label="Alamat" name="alamat" />
        {/* No Telpon & Role */}
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <FormLabelInput label="No Telpon" name="telp" />
          </div>
          <div style={{ flex: 1 }}>
            <label
              htmlFor="role"
              style={{
                display: "block",
                fontSize: 17,
                fontWeight: 400,
                marginBottom: 2
              }}
            >
              Role
            </label>
            <select
              name="role"
              id="role"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "none",
                background: "#D9D9D9",
                fontSize: 17,
                outline: "none"
              }}
              defaultValue=""
              required
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Tombol Tambah */}
        <button
          type="submit"
          style={{
            marginTop: 24,
            background: "#16205C",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 20,
            padding: "10px 40px",
            fontWeight: 500,
            cursor: "pointer",
            display: "block"
          }}
        >
          Tambah
        </button>
      </form>
    </div>
  );
}
