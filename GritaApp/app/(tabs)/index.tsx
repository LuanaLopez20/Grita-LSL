import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, Button } from "react-native";
import { Audio } from "expo-av";

const API_KEY = "a3b607ae808277af855a17a832e613e4ea01975d";

const versos = [
  "En la esquina del tiempo te espero",
  "con palabras que no sabe el viento",
  "tu nombre se queda en mi pecho",
  "como un eco lento y sincero",
  "y el mundo se olvida un momento."
];

export default function App() {

  const [versoActual, setVersoActual] = useState(0);
  const [grabando, setGrabando] = useState(false);
  const [tiempoGrabacion, setTiempoGrabacion] = useState(0);

  const animacionFade = useRef(new Animated.Value(1)).current;

  const grabacion = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    pedirPermisos();
  }, []);

  const pedirPermisos = async () => {
    await Audio.requestPermissionsAsync();
  };

  const iniciarTimer = () => {
    setTiempoGrabacion(0);

    timerRef.current = setInterval(() => {
      setTiempoGrabacion((prev) => prev + 1);
    }, 1000);
  };

  const detenerTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const iniciarEscucha = async () => {
    try {

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      grabacion.current = recording;

      setGrabando(true);
      iniciarTimer();

    } catch (error) {
      console.log(error);
    }
  };

  const detenerEscucha = async () => {
    try {

      await grabacion.current.stopAndUnloadAsync();

      setGrabando(false);
      detenerTimer();

      const uri = grabacion.current.getURI();

      enviarAudio(uri);

    } catch (error) {
      console.log(error);
    }
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

    } catch (error) {
      console.log(error);
    }
  };

  const procesarTexto = (textoDetectado) => {

  const texto = textoDetectado.toLowerCase();

  const indiceVerso = versos.findIndex((verso) => {

    const palabrasClave = verso
      .toLowerCase()
      .split(" ")
      .slice(0, 3) // toma las primeras 3 palabras
      .join(" ");

    return texto.includes(palabrasClave);

  });

  if (indiceVerso !== -1) {

    Animated.sequence([
      Animated.timing(animacionFade, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(animacionFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    setVersoActual(indiceVerso + 1);

  }
};

  const formatoTiempo = (segundos) => {
    const min = String(Math.floor(segundos / 60)).padStart(2, "0");
    const sec = String(segundos % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  return (
    <View style={estilos.container}>

      <Text style={estilos.titulo}>POEMA</Text>

      <Text style={estilos.estado}>
        {grabando
          ? `🔴 GRABANDO ${formatoTiempo(tiempoGrabacion)}`
          : "Presione HABLAR"}
      </Text>

      <Animated.View style={{ opacity: animacionFade }}>

        {versoActual > 0 && (
          <Text style={[estilos.linea, estilos.visible]}>
            {versos[versoActual - 1]}
          </Text>
        )}

      </Animated.View>

      {!grabando ? (
        <Button title="🎤 Hablar" onPress={iniciarEscucha} />
      ) : (
        <Button title="⏹ Detener grabación" onPress={detenerEscucha} />
      )}

    </View>
  );
}

const estilos = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  titulo: {
    fontSize: 80,
    fontWeight: "bold",
    color: "rgb(9, 92, 16)",
    textAlign: "center",
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
  },

  visible: {
    color: "#ffffff",
  },

});