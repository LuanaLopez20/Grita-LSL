import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Voice from "@react-native-voice/voice";

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

  useEffect(() => {
    Voice.onSpeechResults = procesarVoz;
    iniciarEscucha();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const iniciarEscucha = async () => {
    try {
      await Voice.start("es-AR"); 
    } catch (error) {
      console.log(error);
    }
  };

  const procesarVoz = (evento) => {
    const textoDetectado = evento.value[0].toLowerCase();
    console.log("Escuchado:", textoDetectado);
    const indiceVerso = versos.findIndex((verso) =>
      textoDetectado.includes(verso.split(" ")[0].toLowerCase())
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
        {versos.map((linea, indice) => (
          <Text
            key={indice.toString()}
            style={[
              estilos.linea,
              indice < versoActual ? estilos.visible : estilos.oculta
            ]}
          >
            {linea}
          </Text>
        ))}

      </Animated.View>

    </View>
  );
}

const estilos = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
    color: "#000000",
  },

});