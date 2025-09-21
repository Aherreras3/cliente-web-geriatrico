// src/pages/dashboard/test.jsx
import DashboardLayout from '@/components/DashboardLayout';
import ListaTests from '@/components/ListaTests';

export default function TestPage() {
  return (
    <DashboardLayout>
      <div className="p-4">
        <ListaTests />
      </div>
    </DashboardLayout>
  );
}
