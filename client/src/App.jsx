import React from 'react'
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
  const checkHealth = async () => {
    const res = await fetch("http://localhost:8080/health");
    const data = await res.json();
    console.log("Health:", data);
  };

  checkHealth();
}, []);
  return (
    <div>App</div>
  )
}