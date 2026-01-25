import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UsersProvider } from "./context/UsersContext";
import { ScheduleProvider } from "./context/ScheduleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Itinerary from "./pages/Itinerary";
import DayDetail from "./pages/DayDetail";
import AddExpense from "./pages/AddExpense";
import ExpensesList from "./pages/ExpensesList";
import ExpenseSummary from "./pages/ExpenseSummary";
import ManageSchedule from "./pages/ManageSchedule";
import ExpenseDetails from "./pages/ExpenseDetails";
import EditExpense from "./pages/EditExpense";

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ScheduleProvider>
          <UsersProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/overview" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/itinerary" element={<ProtectedRoute><Itinerary /></ProtectedRoute>} />
              <Route path="/day/:id" element={<ProtectedRoute><DayDetail /></ProtectedRoute>} />
              <Route path="/manage/:dayId" element={<ProtectedRoute><ManageSchedule /></ProtectedRoute>} />

              <Route path="/add-expense" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute><ExpensesList /></ProtectedRoute>} />
              <Route path="/expense/:id" element={<ProtectedRoute><ExpenseDetails /></ProtectedRoute>} />
              <Route path="/edit-expense/:id" element={<ProtectedRoute><EditExpense /></ProtectedRoute>} />
              <Route path="/expense-summary" element={<ProtectedRoute><ExpenseSummary /></ProtectedRoute>} />
            </Routes>
          </UsersProvider>
        </ScheduleProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
