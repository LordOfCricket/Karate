import { getMyAcademies, getAcademyRegistrations } from "@/lib/server/domain";
import { CreateAcademyForm } from "@/components/domain/CreateAcademyForm";
import { RegistrationsList } from "@/components/domain/RegistrationsList";

export default async function AcademyTournamentsPage() {
  const academies = await getMyAcademies();
  if (academies.length === 0) {
    return <CreateAcademyForm />;
  }

  const primary = academies[0]!;
  const registrations = await getAcademyRegistrations(primary.id);

  return (
    <RegistrationsList
      title={`${primary.name}'s tournament registrations`}
      registrations={registrations}
      showPlayer
      // Safe here specifically because every row already has representingAcademy === primary,
      // which the backend accepts as authorization for both actions — unlike the coach view,
      // where a student's registration may have been submitted by someone else entirely.
      canWithdraw
      canReevaluate
      emptyDescription="Registrations submitted for your players will appear here."
    />
  );
}
