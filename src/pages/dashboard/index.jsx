import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";
import ResumenDashboard from "@/components/ResumenDashboard";

const DashboardPage = () => {
  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const verificarAutenticacion = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/protegido`, {
          method: "GET",
          credentials: "include" 
        });

        if (res.status === 200) {
          setAutenticado(true);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
        router.push("/login");
      } finally {
        setVerificando(false);
      }
    };

    verificarAutenticacion();
  }, [router]);

if (verificando) {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

  if (!autenticado) return null;

  return (
    <DashboardLayout>
      <ResumenDashboard />
    </DashboardLayout>
  );
};

export default DashboardPage;
