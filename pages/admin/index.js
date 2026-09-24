import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr(async () => ({
  redirect: { destination: "/admin/hero", permanent: false },
}));

export default function AdminIndex() {
  return null;
}
