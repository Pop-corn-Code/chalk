import type { User } from '@/lib/types';

export default function Avatar({ user, size = 26 }: { user: User; size?: number }) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external
      // provider-hosted (Google) image; next/image would need a remote
      // pattern configured, and there's no real benefit to it for a small
      // avatar like this.
      <img
        src={user.avatarUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-full flex-shrink-0 object-cover"
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className="rounded-full flex items-center justify-center font-display font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: user.color,
        color: '#1A2530',
        fontSize: Math.round(size * 0.42),
      }}
    >
      {user.initials}
    </span>
  );
}
