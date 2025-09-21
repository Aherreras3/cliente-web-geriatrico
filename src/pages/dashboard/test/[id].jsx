// src/pages/dashboard/test/[id].jsx
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import TestDetalle from '@/components/TestDetalle';

const TestDetallePage = () => {
  const router = useRouter();
  const { id } = router.query;

  return (
    <DashboardLayout>
      <div className="p-4">
        <TestDetalle id={id} />
      </div>
    </DashboardLayout>
  );
};

export default TestDetallePage;
