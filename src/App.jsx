import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ScheduleProvider } from "./context/ScheduleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Itinerary from "./pages/Itinerary";
import DayDetail from "./pages/DayDetail";
import AddExpense from "./pages/AddExpense";
import ExpenseDetails from "./pages/ExpenseDetails";
import ExpenseSummary from "./pages/ExpenseSummary";
import ManageSchedule from "./pages/ManageSchedule";
import TransactionDetails from "./pages/TransactionDetails";

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ScheduleProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/overview" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/itinerary" element={<ProtectedRoute><Itinerary /></ProtectedRoute>} />
            <Route path="/day/:id" element={<ProtectedRoute><DayDetail /></ProtectedRoute>} />
            <Route path="/manage/:dayId" element={<ProtectedRoute><ManageSchedule /></ProtectedRoute>} />

            <Route path="/add-expense" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><ExpenseDetails /></ProtectedRoute>} />
            <Route path="/expense/:id" element={<ProtectedRoute><TransactionDetails /></ProtectedRoute>} />
            <Route path="/expense-summary" element={<ProtectedRoute><ExpenseSummary /></ProtectedRoute>} />
          </Routes>
        </ScheduleProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
