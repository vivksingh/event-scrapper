import React, { useEffect, useState, createContext, useContext } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// Create a context for event data
const EventContext = createContext();

const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch("https://event-scrapper-alxd.onrender.com/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Failed to fetch events", err));
  }, []);

  return (
    <EventContext.Provider value={{ events }}>
      {children}
    </EventContext.Provider>
  );
};

const useEvents = () => useContext(EventContext);

const EventList = () => {
  const { events } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const validateEmail = (email) => {
    const emailPattern =
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailPattern.test(email);
  };

  const handleSubmit = async () => {
    if (!email || !optIn) {
      alert("Please fill in all fields and agree to the terms.");
      return;
    }

    if (!validateEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType.includes("application/json")) {
        throw new Error("Invalid response from server");
      }

      const data = await res.json();

      if (data.exists || data.message === "Subscription successful") {
        // Redirect to event link
        if (selectedEvent?.link) {
          window.location.href = selectedEvent.link;
        } else {
          alert("Event link not available.");
        }
      } else {
        setSubscriptionStatus("Subscription failed.");
      }
    } catch (err) {
      console.error("Subscription failed", err);
      alert("Subscription failed. Please try again later.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Upcoming Events in Sydney
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <Card key={event.link} className="rounded-2xl shadow-lg">
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
              <p className="text-sm text-gray-500">{event.date}</p>
              <p className="text-sm text-gray-500">{event.venue}</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setSelectedEvent(event);
                      setSubscriptionStatus(null); // Clear previous status
                    }}
                    className="mt-4 w-full"
                  >
                    Get Tickets
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Enter your email</h3>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={optIn}
                        onChange={() => setOptIn(!optIn)}
                      />
                      <span>I agree to receive notifications about this event.</span>
                    </label>
                    <Button onClick={handleSubmit} className="w-full">
                      Proceed to Tickets
                    </Button>
                    {subscriptionStatus && (
                      <div className="mt-4 text-red-500">
                        <p>{subscriptionStatus}</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const App = () => (
  <EventProvider>
    <EventList />
  </EventProvider>
);

export default App;
