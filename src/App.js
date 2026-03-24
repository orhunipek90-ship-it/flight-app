import React, { useMemo, useState } from "react";
import "./styles.css";

const airports = [
  { city: "istanbul", label: "İstanbul", code: "IST" },
  { city: "ankara", label: "Ankara", code: "ESB" },
  { city: "izmir", label: "İzmir", code: "ADB" },
  { city: "berlin", label: "Berlin", code: "BER" },
  { city: "paris", label: "Paris", code: "CDG" },
  { city: "roma", label: "Roma", code: "FCO" },
  { city: "londra", label: "Londra", code: "LHR" }
];

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o");
}

function findAirport(input) {
  const q = normalize(input);
  if (!q) return null;

  return (
    airports.find((a) => a.city === q) ||
    airports.find((a) => a.city.startsWith(q)) ||
    airports.find((a) => a.city.includes(q)) ||
    null
  );
}

export default function App() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const fromSuggestions = useMemo(() => {
    const q = normalize(from);
    if (!q) return [];
    return airports.filter((a) => a.city.includes(q)).slice(0, 6);
  }, [from]);

  const toSuggestions = useMemo(() => {
    const q = normalize(to);
    if (!q) return [];
    return airports.filter((a) => a.city.includes(q)).slice(0, 6);
  }, [to]);

  const handleSelect = (label, setter, showSetter) => {
    setter(label);
    showSetter(false);
  };

  const handleSearch = async () => {
    setErrorText("");
    setResults([]);

    const fromAirport = findAirport(from);
    const toAirport = findAirport(to);

    if (!fromAirport || !toAirport) {
      setErrorText("Geçerli şehir gir. Örnek: Paris, İstanbul, Berlin");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/flights?from=${fromAirport.code}&to=${toAirport.code}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "API hatası");
      }

      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      setErrorText(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Uçuş Ara</h1>

      <div className="inputGroup">
        <input
          placeholder="Nereden"
          value={from}
          onFocus={() => setShowFrom(true)}
          onBlur={() => setTimeout(() => setShowFrom(false), 180)}
          onChange={(e) => setFrom(e.target.value)}
        />
        {showFrom && fromSuggestions.length > 0 && (
          <div className="suggestions">
            {fromSuggestions.map((item) => (
              <button
                type="button"
                key={item.code}
                className="suggestionItem"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item.label, setFrom, setShowFrom)}
                onTouchStart={() =>
                  handleSelect(item.label, setFrom, setShowFrom)
                }
              >
                {item.label} ({item.code})
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="inputGroup">
        <input
          placeholder="Nereye"
          value={to}
          onFocus={() => setShowTo(true)}
          onBlur={() => setTimeout(() => setShowTo(false), 180)}
          onChange={(e) => setTo(e.target.value)}
        />
        {showTo && toSuggestions.length > 0 && (
          <div className="suggestions">
            {toSuggestions.map((item) => (
              <button
                type="button"
                key={item.code}
                className="suggestionItem"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item.label, setTo, setShowTo)}
                onTouchStart={() =>
                  handleSelect(item.label, setTo, setShowTo)
                }
              >
                {item.label} ({item.code})
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="searchBtn" onClick={handleSearch} disabled={loading}>
        {loading ? "Aranıyor..." : "Ara"}
      </button>

      {errorText ? <p className="errorText">{errorText}</p> : null}

      <div className="results">
        {!loading && results.length === 0 && !errorText ? (
          <p className="emptyText">Henüz sonuç yok</p>
        ) : null}

        {results.map((flight, index) => (
          <div className="card" key={`${flight.airline}-${flight.time}-${index}`}>
            <h3>{flight.airline}</h3>
            <p>📍 {flight.route}</p>
            <p>🕒 {flight.time}</p>
            <p className="price">💸 {flight.price}€</p>
            <button
              className="alertBtn"
              onClick={() => alert("Fiyat alarmı kuruldu!")}
            >
              Fiyat alarmı kur
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}