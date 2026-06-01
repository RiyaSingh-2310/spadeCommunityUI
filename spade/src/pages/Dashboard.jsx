import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function Dashboard() {
  return (
    <div className="flex bg-grey min-h-screen">
      
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <div className="pt-20 p-6">
          <h1 className="text-3xl text-white font-bold">
            Dashboard
          </h1>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;

