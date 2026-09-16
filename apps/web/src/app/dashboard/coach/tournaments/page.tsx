import { getCoachProfile, getMyStudentsRegistrations } from "@/lib/server/domain";
import { CoachProfileForm } from "@/components/domain/CoachProfileForm";
import { RegistrationsList } from "@/components/domain/RegistrationsList";

export default async function CoachTournamentsPage() {
  const profile = await getCoachProfile();
  if (!profile) {
    return <CoachProfileForm />;
  }

  const registrations = await getMyStudentsRegistrations();

  return (
    <RegistrationsList
      title="Students' tournament registrations"
      registrations={registrations}
      showPlayer
      emptyDescription="Registrations submitted for players at academies you're affiliated with will appear here."
    />
  );
}
