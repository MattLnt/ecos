'use client';

interface PlayerAvatarProps {
  photo?: string | null;
  avatar: string;
  firstName: string;
  lastName?: string;
  /** Taille et marges, par exemple « w-10 h-10 ». */
  className?: string;
  /** Classes supplémentaires du cercle : anneau, ombre… */
  ringClassName?: string;
}

/**
 * La pastille ronde d'un joueur.
 *
 * Les photos sont des carrés détourés où le visage occupe la moitié haute et
 * laisse du vide autour. Dans un cercle de même proportion, `object-fit: cover`
 * ne recadre rien du tout — `object-position` n'a aucun effet — et on obtient
 * un petit visage posé bas, perdu dans le cercle.
 *
 * On affiche donc la photo plus grande que le cercle et on la remonte : la
 * fenêtre visible tombe sur le visage. Les valeurs sont calées sur le cadrage
 * des photos du club, tête entre 15 % et 75 % de la hauteur.
 */
export function PlayerAvatar({
  photo,
  avatar,
  firstName,
  lastName = '',
  className = 'w-10 h-10',
  ringClassName = '',
}: PlayerAvatarProps) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

  if (!photo) {
    return (
      <div
        className={`${className} ${ringClassName} shrink-0 rounded-full flex items-center justify-center font-bold text-[#0A1628] leading-none`}
        style={{ backgroundColor: avatar, fontSize: '0.7em' }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`${className} ${ringClassName} shrink-0 rounded-full overflow-hidden relative`}>
      <img
        src={photo}
        alt=""
        className="absolute w-[130%] h-[130%] max-w-none left-[-15%] top-[-10%] object-cover"
      />
    </div>
  );
}
