"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ExpertConnectForm() {
  const searchParams = useSearchParams();
  const backHref = searchParams.get("back") || "/#services";

  const [expertForm, setExpertForm] = useState({
    name: "",
    age: "",
    countryCode: "+1",
    contact: "",
    email: "",
    goals: "",
    reason: "",
  });
  const [expertSubmitted, setExpertSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExpertChange = (e) => {
    const { name, value } = e.target;
    setExpertForm((f) => ({ ...f, [name]: value }));
  };

  const handleExpertSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/expert-connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expertForm),
      });

      if (response.ok) {
        setExpertSubmitted(true);
      } else {
        setError("Failed to submit. Please try again.");
      }
    } catch (err) {
      setError("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href={backHref} className="text-blue-600 hover:underline">
          ← Back
        </Link>
      </div>
      <h1 className="mb-6 text-3xl font-bold">Connect to an Expert</h1>
      <form onSubmit={handleExpertSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={expertForm.name}
            onChange={handleExpertChange}
            className="w-full rounded border p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Age</label>
          <input
            type="number"
            name="age"
            value={expertForm.age}
            onChange={handleExpertChange}
            className="w-full rounded border p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Contact</label>
          <div className="flex gap-2">
            <select
              name="countryCode"
              value={expertForm.countryCode}
              onChange={handleExpertChange}
              className="w-1/3 rounded border p-2"
            >
              <option value="+1">+1 (US/Canada)</option>
              <option value="+44">+44 (UK)</option>
              <option value="+91">+91 (India)</option>
              <option value="+61">+61 (Australia)</option>
              <option value="+971">+971 (UAE)</option>
              <option value="+65">+65 (Singapore)</option>
              <option value="+27">+27 (South Africa)</option>
              <option value="+234">+234 (Nigeria)</option>
              <option value="+254">+254 (Kenya)</option>
              <option value="+86">+86 (China)</option>
              <option value="+81">+81 (Japan)</option>
              <option value="+49">+49 (Germany)</option>
              <option value="+33">+33 (France)</option>
              <option value="+55">+55 (Brazil)</option>
              <option value="+52">+52 (Mexico)</option>
            </select>
            <input
              type="tel"
              name="contact"
              value={expertForm.contact}
              onChange={handleExpertChange}
              className="w-2/3 rounded border p-2"
              placeholder="Phone number"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={expertForm.email}
            onChange={handleExpertChange}
            className="w-full rounded border p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Goals</label>
          <textarea
            name="goals"
            value={expertForm.goals}
            onChange={handleExpertChange}
            className="w-full rounded border p-2"
            rows={3}
            placeholder="e.g., Lose 10kg, build muscle, improve endurance"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Reason for contacting</label>
          <textarea
            name="reason"
            value={expertForm.reason}
            onChange={handleExpertChange}
            className="w-full rounded border p-2"
            rows={3}
            placeholder="Tell us why you'd like to connect with an expert"
            required
          />
        </div>
        <button type="submit" className="rounded bg-green-600 px-6 py-2 font-bold text-white" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>

      {expertSubmitted && (
        <div className="mt-6 rounded-xl bg-green-50 p-6 shadow">
          <p className="font-medium text-green-800">Request submitted! An expert will contact you soon.</p>
        </div>
      )}
    </div>
  );
}

export default function ExpertConnect() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">Loading...</div>}>
      <ExpertConnectForm />
    </Suspense>
  );
}
