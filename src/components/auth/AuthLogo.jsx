import logo from "../../assets/SpadeCommunitylogoWhite.png";

function AuthLogo() {
  return (
    <div className="mb-5 flex w-full justify-center sm:mb-6">
      <img
        src={logo}
        alt="Spade Community logo"
        className="h-[38px] w-auto max-w-[220px] object-contain sm:h-[46px] sm:max-w-[260px] md:h-[54px] md:max-w-[300px]"
      />
    </div>
  );
}

export default AuthLogo;
