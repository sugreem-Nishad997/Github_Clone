import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  GitBranch,
  AlertCircle,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowLeft,
  RotateCw,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const Signup = () => {
  // Step 1: Account form; Step 2: OTP verification
  const [step, setStep] = useState(1);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  const { sendVerificationOtp, resendVerificationOtp, verifyAndSignup } = useAuth();
  const navigate = useNavigate();

  // Input refs for 6 OTP boxes
  const inputRefs = useRef([]);

  // Resend countdown timer
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  // Focus first OTP input when step changes to 2
  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  // Handle Step 1 Submit (Send OTP)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const res = await sendVerificationOtp(username, email);
    if (res.success) {
      setStep(2);
      setResendTimer(60);
      setSuccessMsg(`Verification code sent to ${email}`);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  // Handle OTP digit changes with auto-focus & backspace navigation
  const handleDigitChange = (index, value) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal && value !== "") return;

    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      // User pasted multiple digits into one box
      const pasted = cleanVal.slice(0, 6).split("");
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      if (inputRefs.current[nextIdx]) {
        inputRefs.current[nextIdx].focus();
      }
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (cleanVal && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      // Move to previous input on backspace
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newDigits[i] = char;
    });
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pastedData.length, 5);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
    }
  };

  // Handle Step 2 Submit (Verify OTP & Register)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    const res = await verifyAndSignup(username, email, password, fullOtp);
    if (res.success) {
      navigate("/");
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendLoading) return;

    setError(null);
    setSuccessMsg(null);
    setResendLoading(true);

    const res = await resendVerificationOtp(email, username);
    if (res.success) {
      setResendTimer(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setSuccessMsg("A new verification code has been sent to your email!");
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } else {
      setError(res.message);
    }
    setResendLoading(false);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gh-accent/10 border border-gh-accent/30 text-gh-accent mb-3">
            {step === 1 ? <GitBranch className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-bold text-gh-heading tracking-tight">
            {step === 1 ? "Join ApnaGit" : "Verify Your Email"}
          </h1>
          <p className="text-xs text-gh-muted mt-1">
            {step === 1
              ? "Create your account to start managing repositories"
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-gh-surface border border-gh-border rounded-xl p-6 shadow-xl space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="bg-gh-danger/10 border border-gh-danger/30 rounded-md p-3 text-xs text-gh-dangerHover flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="bg-gh-success/10 border border-gh-success/30 rounded-md p-3 text-xs text-gh-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: ACCOUNT DETAILS */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gh-heading mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gh-muted" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    placeholder="johndoe"
                    className="w-full bg-gh-bg border border-gh-border rounded-md pl-9 pr-3 py-2 text-sm text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gh-heading mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gh-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    placeholder="name@example.com"
                    className="w-full bg-gh-bg border border-gh-border rounded-md pl-9 pr-3 py-2 text-sm text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gh-heading mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gh-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-gh-bg border border-gh-border rounded-md pl-9 pr-3 py-2 text-sm text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gh-success hover:bg-gh-successHover text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors border border-gh-border disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending verification code...</span>
                  </>
                ) : (
                  "Continue to Verification"
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-gh-bg border border-gh-border rounded-lg p-3 flex items-center justify-between text-xs">
                <div className="truncate">
                  <span className="text-gh-muted block text-[11px]">Sending code to:</span>
                  <span className="font-semibold text-gh-heading truncate">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-gh-accent hover:underline flex items-center gap-1 flex-shrink-0 text-[11px] font-medium ml-2"
                >
                  <ArrowLeft className="w-3 h-3" /> Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gh-heading mb-2 text-center">
                  Enter 6-Digit OTP Code
                </label>
                {/* 6 Digit Split Input Boxes */}
                <div className="flex justify-between gap-1.5 sm:gap-2 my-2" onPaste={handlePaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-11 h-12 sm:w-12 sm:h-12 text-center text-lg font-bold font-mono bg-gh-bg border border-gh-border rounded-md text-gh-heading focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent transition-all select-all"
                    />
                  ))}
                </div>
              </div>

              {/* Resend Code Section */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gh-muted">Didn't receive code?</span>
                {resendTimer > 0 ? (
                  <span className="text-gh-muted font-mono text-[11px]">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    className="text-gh-accent hover:underline font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <RotateCw className={`w-3 h-3 ${resendLoading ? "animate-spin" : ""}`} />
                    Resend code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join("").length < 6}
                className="w-full bg-gh-success hover:bg-gh-successHover text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors border border-gh-border disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  "Verify & Create Account"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Sign in Link */}
        <div className="bg-gh-surface/40 border border-gh-border rounded-lg p-4 text-center mt-4 text-xs text-gh-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-gh-accent hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
