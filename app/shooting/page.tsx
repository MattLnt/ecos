import { ShootingSession } from '@/components/shooting/ShootingSession';
import '@/components/shooting/shooting.css';

export default function ShootingPage() {
  return (
    <ShootingSession
      playerName="MATHIEU"
      playerPos="SG"
      sessionName="SESSION 1"
      theme="hardwood"
    />
  );
}