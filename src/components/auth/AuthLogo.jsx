import logo from "../../assets/spade-community-logo.png";

/** Aspect ratio of brand-logo-horizontal.png exported from spade-comunity-logo2.ai */
const LOGO_ASPECT = 1000 / 289;
const LOGO_HEIGHT = 64;

function AuthLogo() {
  // Match Client UI prominence (horizontal lockup from Logo 2 artwork).
  return (
    <div className="mb-5 flex w-full justify-center sm:mb-6">
      <img
        src={logo}
        alt="Spade Community logo"
        className="h-12 w-auto max-w-[min(100%,320px)] object-contain sm:h-14 sm:max-w-[360px] md:h-16 md:max-w-[400px]"
        width={Math.round(LOGO_HEIGHT * LOGO_ASPECT)}
        height={LOGO_HEIGHT}
        decoding="async"
      />
    </div>
  );
}

export default AuthLogo;
