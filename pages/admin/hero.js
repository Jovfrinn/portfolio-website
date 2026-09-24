import AdminLayout from "../../components/admin/AdminLayout";
import LocaleTabs from "../../components/admin/LocaleTabs";
import FormField, { TextInput, TextArea } from "../../components/admin/FormField";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

function setDeep(portfolio, keyPath, value) {
  const next = structuredClone(portfolio);
  let target = next;
  for (let i = 0; i < keyPath.length - 1; i++) target = target[keyPath[i]];
  target[keyPath[keyPath.length - 1]] = value;
  return next;
}

export default function HeroAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Hero">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const set = (keyPath, value) => updatePortfolio((prev) => setDeep(prev, keyPath, value));

  const updateButton = (index, field, value) => {
    const buttons = portfolio.heroButtons.map((btn, i) => (i === index ? { ...btn, [field]: value } : btn));
    set(["heroButtons"], buttons);
  };

  return (
    <AdminLayout title="Hero" previewHref="/">
      <LocaleTabs
        renderEn={() => (
          <>
            <FormField label="Badge text">
              <TextInput value={portfolio.headerTaglineOne.en} onChange={(e) => set(["headerTaglineOne", "en"], e.target.value)} />
            </FormField>
            <FormField label="Headline">
              <TextInput value={portfolio.headerTaglineTwo.en} onChange={(e) => set(["headerTaglineTwo", "en"], e.target.value)} />
            </FormField>
            <FormField label="Sub-headline (kalimat lengkap, salah satu kata rotasi di bawah akan di-highlight biru)">
              <TextInput value={portfolio.headerTaglineThree.en} onChange={(e) => set(["headerTaglineThree", "en"], e.target.value)} />
            </FormField>
            <FormField label="Kata rotasi (pisahkan dengan koma)">
              <TextInput
                value={portfolio.headerTaglineThreeRotations.en.join(", ")}
                onChange={(e) => set(["headerTaglineThreeRotations", "en"], e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              />
            </FormField>
            <FormField label="Deskripsi">
              <TextArea value={portfolio.headerTaglineFour.en} onChange={(e) => set(["headerTaglineFour", "en"], e.target.value)} />
            </FormField>
          </>
        )}
        renderId={() => (
          <>
            <FormField label="Teks badge">
              <TextInput value={portfolio.headerTaglineOne.id} onChange={(e) => set(["headerTaglineOne", "id"], e.target.value)} />
            </FormField>
            <FormField label="Headline">
              <TextInput value={portfolio.headerTaglineTwo.id} onChange={(e) => set(["headerTaglineTwo", "id"], e.target.value)} />
            </FormField>
            <FormField label="Sub-headline (kalimat lengkap)">
              <TextInput value={portfolio.headerTaglineThree.id} onChange={(e) => set(["headerTaglineThree", "id"], e.target.value)} />
            </FormField>
            <FormField label="Kata rotasi (pisahkan dengan koma)">
              <TextInput
                value={portfolio.headerTaglineThreeRotations.id.join(", ")}
                onChange={(e) => set(["headerTaglineThreeRotations", "id"], e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              />
            </FormField>
            <FormField label="Deskripsi">
              <TextArea value={portfolio.headerTaglineFour.id} onChange={(e) => set(["headerTaglineFour", "id"], e.target.value)} />
            </FormField>
          </>
        )}
      />

      <h3 className="text-sm font-mono text-zinc-400 mt-8 mb-3">Tombol Hero</h3>
      {portfolio.heroButtons.map((btn, idx) => (
        <div key={btn.id} className="grid grid-cols-3 gap-3 mb-3">
          <TextInput placeholder="Label EN" value={btn.labelEn} onChange={(e) => updateButton(idx, "labelEn", e.target.value)} />
          <TextInput placeholder="Label ID" value={btn.labelId} onChange={(e) => updateButton(idx, "labelId", e.target.value)} />
          <TextInput placeholder="Link (href)" value={btn.href} onChange={(e) => updateButton(idx, "href", e.target.value)} />
        </div>
      ))}

      <PublishBar />
    </AdminLayout>
  );
}
