import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Audio } from "expo-av";

const API_KEY = "a3b607ae808277af855a17a832e613e4ea01975d";

const versos = [
  "En la esquina del tiempo te espero",
  "con palabras que no sabe el viento",
  "tu nombre se queda en mi pecho",
  "como un eco lento y sincero",
  "y el mundo se olvida un momento."
];

const colores = [
  "#0B0C10",
  "#1F2833",
  "#2E4057",
  "#3A506B",
  "#5BC0BE",
  "#C5C6C7"
];

const generarParticulas = () =>
  Array.from({ length: 35 }).map(() => ({
    x: Math.random() * 400,
    y: Math.random() * 800,
    speed: 0.3 + Math.random() * 1.5,
    size: 2 + Math.random() * 4,
    opacity: 0.2 + Math.random() * 0.6,
  }));

export default function App() {

  const [versoActual, setVersoActual] = useState(0);
  const [grabando, setGrabando] = useState(false);
  const [tiempoGrabacion, setTiempoGrabacion] = useState(0);
  const [textoAnimado, setTextoAnimado] = useState("");

  const animacionFade = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const grabacion = useRef(null);
  const timerRef = useRef(null);
  const cicloActivo = useRef(false);

  const particulas = useRef(generarParticulas()).current;
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    pedirPermisos();
    cicloEscucha();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.03,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const interval = setInterval(() => {

      particulas.forEach((p) => {
        p.y -= p.speed * 2;

        if (p.y < -10) {
          p.y = 800;
          p.x = Math.random() * 400;
        }

        p.x += Math.sin(p.y * 0.01) * 0.5;
      });

      forceUpdate(v => v + 1);

    }, 30);

    return () => clearInterval(interval);

  }, []);

  const pedirPermisos = async () => {
    await Audio.requestPermissionsAsync();
  };

  const cicloEscucha = async () => {
    if (cicloActivo.current) return;
    cicloActivo.current = true;

    const grabar = async () => {

      if (versoActual >= versos.length) {
        cicloActivo.current = false;
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      grabacion.current = recording;

      setGrabando(true);

      setTimeout(async () => {

        await recording.stopAndUnloadAsync();

        setGrabando(false);

        const uri = recording.getURI();
        await enviarAudio(uri);

        grabar();

      }, 3000);

    };

    grabar();
  };

  const enviarAudio = async (uri) => {
    try {

      const audio = await fetch(uri);
      const buffer = await audio.arrayBuffer();

      const respuesta = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-2&language=es",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${API_KEY}`,
            "Content-Type": "audio/wav",
          },
          body: buffer,
        }
      );

      const data = await respuesta.json();

      const texto =
        data.results.channels[0].alternatives[0].transcript;

      procesarTexto(texto);

    } catch (e) {
      console.log(e);
    }
  };

  const procesarTexto = (textoDetectado) => {

    const texto = textoDetectado.toLowerCase();

    const indiceVerso = versos.findIndex((v) => {
      const clave = v.toLowerCase().split(" ").slice(0, 3).join(" ");
      return texto.includes(clave);
    });

    if (indiceVerso !== -1) {

      Animated.sequence([
        Animated.timing(animacionFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animacionFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start();

      setVersoActual(indiceVerso + 1);
      animarTexto(versos[indiceVerso]);
    }
  };

  const animarTexto = (texto) => {
    setTextoAnimado("");

    let i = 0;
    const intervalo = setInterval(() => {
      setTextoAnimado(texto.slice(0, i));
      i++;
      if (i > texto.length) clearInterval(intervalo);
    }, 40);
  };

  return (
    <Animated.View
      style={[
        estilos.container,
        {
          backgroundColor: colores[versoActual % colores.length],
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >

      <View style={StyleSheet.absoluteFill}>
        {particulas.map((p, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: 50,
              backgroundColor: "white",
              opacity: p.opacity,
            }}
          />
        ))}
      </View>

      <Text style={estilos.titulo}>POEMA</Text>

      <Text style={estilos.estado}>
        {grabando ? "🔴 ESCUCHANDO..." : "INICIANDO..."}
      </Text>

      <Animated.View style={{ opacity: animacionFade }}>
        {versoActual > 0 && (
          <Text style={estilos.linea}>{textoAnimado}</Text>
        )}
      </Animated.View>

    </Animated.View>
  );
}

const estilos = StyleSheet.create({

  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    overflow: "hidden"
  },

  titulo: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(255,255,255,0.3)",
    textShadowRadius: 20,
    marginVertical: 50,
  },

  estado: {
    color: "red",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
  },

  linea: {
    fontSize: 32,
    textAlign: "center",
    marginVertical: 40,
    color: "#fff",
    textShadowColor: "rgba(255,255,255,0.5)",
    textShadowRadius: 15,
  },

});