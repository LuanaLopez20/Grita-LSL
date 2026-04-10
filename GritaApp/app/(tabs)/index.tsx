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
  const animacionScroll = useRef(new Animated.Value(0)).current;
  const grabacion = useRef(null);

  useEffect(() => {
    pedirPermisos();
  }, []);

  const pedirPermisos = async () => {
    await Audio.requestPermissionsAsync();
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

      console.log("🎤 Grabando...");
    } catch (error) {
      console.log(error);
    }
  };

  const detenerEscucha = async () => {
    try {
      await grabacion.current.stopAndUnloadAsync();

      const uri = grabacion.current.getURI();

      console.log("Audio:", uri);

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

      console.log("Escuchado:", texto);

      procesarTexto(texto);

    } catch (error) {
      console.log(error);
    }
  };

  const procesarTexto = (textoDetectado) => {
    const texto = textoDetectado.toLowerCase();

    const indiceVerso = versos.findIndex((verso) =>
      texto.includes(verso.split(" ")[0].toLowerCase())
    );

    if (indiceVerso !== -1) {
      setVersoActual(indiceVerso + 1);

      Animated.spring(animacionScroll, {
        toValue: -(indiceVerso * 100),
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={estilos.container}>

      <Text style={estilos.titulo}>POEMA</Text>

      <Animated.View style={{ transform: [{ translateY: animacionScroll }] }}>

          {versos.map((linea, indice) => {
    if (indice >= versoActual) return null;

    return (
      <Text key={indice} style={[estilos.linea, estilos.visible]}>
        {linea}
      </Text>
    );
  })}

      </Animated.View>

      <Button title="🎤 Hablar" onPress={iniciarEscucha} />
      <Button title="⏹ Detener" onPress={detenerEscucha} />

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

  linea: {
    fontSize: 28,
    textAlign: "center",
    marginVertical: 40,
  },

visible: {
  color: "#ffffff",
},

oculta: {
  color: "rgba(255,255,255,0.2)",
},

});