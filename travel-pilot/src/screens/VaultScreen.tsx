import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import { cacheDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';
import { getEU261Amount } from '../utils/flightUtils';
import { BACKEND_URL } from '../../config';


export default function VaultScreen() {
    const {
        legalShieldActive, setViewDoc, setIsScanning, claims, setClaims, removeClaim, flightData,
        compensationEligible, extraDocs, setExtraDocs, isExtracting, simulateGmailSync, user,
        removeExtraDoc, setHasNewDoc 
    } = useAppContext();

    React.useEffect(() => {
        setHasNewDoc(false);
    }, []);

    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [showRights, setShowRights] = useState(false);
    const [showSignature, setShowSignature] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);
    const [signedClaimId, setSignedClaimId] = useState<string | null>(null);
    const webViewRef = useRef<WebView>(null);
    const [capturedSignature, setCapturedSignature] = useState<string | null>(null);
    const [pendingDoc, setPendingDoc] = useState<{ uri: string, type: string } | null>(null);
    const [currentClaimForSig, setCurrentClaimForSig] = useState<any>(null);
    // showConfirmUpload eliminado en favor de Alerta nativa


    const uploadDocument = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("PERMISO DENEGADO", "Se requiere acceso a la galería para subir tus documentos.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false, // Simplificamos quitando el recorte para evitar errores
                quality: 0.7,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                const fileType = uri.split('.').pop() || 'jpg';
                setPendingDoc({ uri, type: fileType });

                // USAMOS ALERTA NATIVA PARA MÁXIMA VISIBILIDAD
                // Ponemos un título bien gráfico para que no se pierda
                Alert.alert(
                    "AÑADIR DOCUMENTO",
                    "Pasaporte, Tarjeta de embarque, reservas de hotel, etc.\n\n¿Quieres guardar este documento en tu Bóveda Segura? Se encriptará con AES-256.",
                    [
                        { text: "CANCELAR", style: "cancel", onPress: () => setPendingDoc(null) },
                        { 
                            text: "SÍ, SUBIR AHORA", 
                            onPress: () => {
                                // Llamamos directamente a confirmAndUpload pasando el doc actual
                                confirmAndUpload({ uri, type: fileType });
                            } 
                        }
                    ]
                );
            }
        } catch (e) {
            Alert.alert("ERROR", "No se pudo abrir la galería.");
        }
    };

    const confirmAndUpload = async (forcedDoc?: { uri: string, type: string }) => {
        const docToUpload = forcedDoc || pendingDoc;
        if (!docToUpload) return;
        
        try {
            setUploadingDoc(true);
            const formData = new FormData();
            formData.append('file', {
                uri: docToUpload.uri,
                name: `upload_${Date.now()}.${docToUpload.type}`,
                type: `image/${docToUpload.type}`
            } as any);

            const response = await fetch(`${BACKEND_URL}/api/uploadDocument`, {
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const data = await response.json();
            if (response.ok) {
                setExtraDocs([
                    {
                        id: `upload_${Date.now()}`,
                        t: 'DOCUMENTO SEGURO',
                        s: 'Añadido manualmente',
                        i: data.url,
                        source: 'DOCS',
                        icon: '🖼️',
                        verified: true
                    },
                    ...extraDocs
                ]);
                setPendingDoc(null);
                Alert.alert("ÉXITO", "Documento encriptado y guardado en tu Bóveda Segura.");
            } else {
                Alert.alert("ERROR", data.error || "Fallo en la subida al servidor.");
            }
        } catch (e) {
            Alert.alert("ERROR DE RED", "No se pudo contactar con la central.");
        } finally {
            setUploadingDoc(false);
        }
    };

    const documents = Array.isArray(extraDocs) ? extraDocs : [];

    // Función interna para gestionar el borrado (100% garantizada para todos)
    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            "🗑️ ELIMINAR DOCUMENTO",
            `¿Estás seguro de que quieres borrar "${name}"? Esta acción no se puede deshacer.`,
            [
                { text: "CANCELAR", style: "cancel" },
                { 
                    text: "BORRAR", 
                    style: "destructive", 
                    onPress: () => {
                        removeExtraDoc(id); 
                    }
                }
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 100, paddingBottom: 160, flexGrow: 1 }}>

            {/* ——— ESCUDO LEGAL ACTIVO ——— */}
            {(legalShieldActive || compensationEligible) && (
                <View style={{
                    backgroundColor: 'rgba(39, 201, 63, 0.08)',
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(39, 201, 63, 0.4)',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                    <View style={{
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: 'rgba(39, 201, 63, 0.15)',
                        justifyContent: 'center', alignItems: 'center', marginRight: 14
                    }}>
                        <Text style={{ fontSize: 22 }}>🛡️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#27C93F', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>PROTECCIÓN LEGAL ACTIVA</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 11, marginTop: 3 }}>
                            {flightData?.status === 'delayed'
                                ? `Expediente activo: retraso de ${flightData.departure?.delay || 0} min detectado.`
                                : 'Protección activada para tu viaje actual.'}
                        </Text>
                    </View>
                </View>
            )}

            {/* ——— ESTADO DEL ASISTENTE ——— */}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Alert.alert(
                    "📊 ESTADO DEL ASISTENTE",
                    "ESTADO: Activo y Protegido\nConectado a: tu email y datos de vuelo\nÚLTIMA ACTUALIZACIÓN: Reciente\n\nTu asistente está vigilando 3 documentos detectados y comprobando tu conexión en tiempo real.",
                    [{ text: "ENTENDIDO", style: "default" }]
                )}
                style={{
                    backgroundColor: '#111',
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 24,
                    borderLeftWidth: 4,
                    borderLeftColor: '#AF52DE',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: '#4CD964', marginRight: 12,
                }} />
                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>🧠 ASISTENTE ACTIVO</Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 11, marginTop: 3 }}>Conectado con: tu email // Hace 12 min</Text>
                </View>
                <Text style={{ color: '#B0B0B0', fontSize: 19 }}>›</Text>
            </TouchableOpacity>

            {/* ——— SINCRONIZACIÓN DE EMAIL ——— */}
            <TouchableOpacity
                onPress={simulateGmailSync}
                disabled={isExtracting}
                style={{
                    backgroundColor: '#1A1A1A',
                    padding: 18,
                    borderRadius: 16,
                    marginBottom: 24,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#333',
                    borderStyle: isExtracting ? 'dashed' : 'solid'
                }}
            >
                {isExtracting ? (
                    <ActivityIndicator size="small" color="#AF52DE" style={{ marginRight: 10 }} />
                ) : (
                    <Text style={{ fontSize: 18, marginRight: 10 }}>📧</Text>
                )}
                <Text style={{ color: isExtracting ? '#555' : '#AF52DE', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>
                    {isExtracting ? 'BUSCANDO DOCUMENTOS...' : 'ACTUALIZAR CON MIS CORREOS'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={uploadDocument}
                disabled={uploadingDoc}
                style={{
                    backgroundColor: '#111',
                    padding: 18,
                    borderRadius: 16,
                    marginBottom: 24,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#D4AF37',
                    borderStyle: uploadingDoc ? 'dashed' : 'solid'
                }}
            >
                <Text style={{ fontSize: 24, marginRight: 15 }}>📤</Text>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: uploadingDoc ? '#555' : '#D4AF37', fontWeight: '900', fontSize: 16, letterSpacing: 1 }}>
                        {uploadingDoc ? 'ENCRIPTANDO...' : 'AÑADIR DOCUMENTO'}
                    </Text>
                    <Text style={{ color: uploadingDoc ? '#444' : '#888', fontSize: 11, marginTop: 2 }}>
                        Pasaporte, Tarjeta de embarque, etc.
                    </Text>
                </View>
                {uploadingDoc && <ActivityIndicator size="small" color="#D4AF37" />}
            </TouchableOpacity>

            {/* ——— DOCUMENTACIÓN PROTEGIDA ——— */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 }}>🔐 MIS DOCUMENTOS</Text>
                <View style={{ backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: '#4CD964', fontSize: 9, fontWeight: 'bold' }}>Alta Seguridad</Text>
                </View>
            </View>

            {documents.map((d, i) => (
                <View 
                    key={d.id || i}
                    style={{ 
                        backgroundColor: '#111', 
                        borderRadius: 18, 
                        marginBottom: 12, 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        borderWidth: 1, 
                        borderColor: '#1A1A1A', 
                        overflow: 'hidden'
                    }}
                >
                    {/* Botón principal para ver documento */}
                    <TouchableOpacity
                        onPress={() => {
                            if (!d) return;
                            setViewDoc(d);
                            setIsScanning(true);
                            setTimeout(() => setIsScanning(false), 2500);
                        }}
                        activeOpacity={0.7}
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 18 }}
                    >
                        {/* Icono + miniatura */}
                        <View style={{
                            width: 52, height: 52, borderRadius: 14,
                            backgroundColor: '#0A0A0A',
                            justifyContent: 'center', alignItems: 'center',
                            borderWidth: 1, borderColor: '#222',
                            overflow: 'hidden',
                        }}>
                            {d.i && <Image source={typeof d.i === 'number' ? d.i : { uri: d.i }} style={{ width: 52, height: 52, borderRadius: 14 }} />}
                            <Text style={{ position: 'absolute', fontSize: 21 }}>{d.icon || '📄'}</Text>
                        </View>

                        {/* Info del documento */}
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{d.t || 'Documento'}</Text>
                                {d.isDemo && (
                                    <View style={{ marginLeft: 8, backgroundColor: 'rgba(255, 149, 0, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#FF9500' }}>
                                        <Text style={{ color: '#FF9500', fontSize: 8, fontWeight: '900' }}>DEMO</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={{ color: '#B0B0B0', fontSize: 11, marginTop: 3 }}>{d.s || 'Sin detalles'}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Botón lateral independiente para borrar */}
                    <TouchableOpacity 
                        onPress={() => handleDelete(d.id || '', d.t || 'Documento')}
                        style={{ 
                            backgroundColor: 'rgba(255, 59, 48, 0.05)',
                            padding: 20,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderLeftWidth: 1, 
                            borderLeftColor: '#222'
                        }}
                    >
                        <Text style={{ color: '#FF3B30', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                    </TouchableOpacity>
                </View>
            ))}

            {/* ——— GESTIÓN DE REEMBOLSOS EU261 ——— */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 14 }}>
                <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 }}>⚖️ REEMBOLSOS Y RECLAMACIONES</Text>
                


                {claims.length > 0 && (
                    <View style={{ backgroundColor: '#27C93F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 }}>
                        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>{claims.length} ACTIVA{claims.length > 1 ? 'S' : ''}</Text>
                    </View>
                )}
            </View>

            {/* Botón de Manual de Derechos (Siempre visible) */}
            <TouchableOpacity
                onPress={() => setShowRights(true)}
                style={{
                    backgroundColor: 'rgba(175, 82, 222, 0.1)',
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(175, 82, 222, 0.4)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20
                }}
            >
                <Text style={{ fontSize: 18, marginRight: 10 }}>📖</Text>
                <Text style={{ color: '#AF52DE', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 }}>GUÍA DE DERECHOS DEL PASAJERO EU261</Text>
            </TouchableOpacity>

            {claims.length === 0 ? (
                <View style={{
                    backgroundColor: '#0D0D0D', borderRadius: 16, padding: 30,
                    alignItems: 'center', borderWidth: 1, borderColor: '#222', borderStyle: 'dashed'
                }}>
                    <Text style={{ fontSize: 31, marginBottom: 12 }}>⚖️</Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>SIN RECLAMACIONES</Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 11, textAlign: 'center', marginTop: 6 }}>
                        Si tu vuelo se retrasa más de 3 horas, te ayudaremos a reclamar automáticamente.
                    </Text>
                </View>
            ) : (
                claims.map((c: any, i: number) => (
                    <TouchableOpacity
                        key={c.id || i}
                        activeOpacity={0.7}
                        onPress={() => {
                            if (signedClaimId !== c.id) {
                                setCapturedSignature(null); // Reset signature
                                setCurrentClaimForSig(c);
                                setHasSigned(false);
                                setShowSignature(true);
                            } else if (signedClaimId === c.id) {
                                Alert.alert("Estado", "El documento ya está firmado y en proceso de cobro.");
                            }
                        }}
                        style={{
                            backgroundColor: '#111',
                            borderRadius: 16,
                            padding: 18,
                            marginBottom: 12,
                            borderLeftWidth: 4,
                            borderLeftColor: c.isDynamic ? '#FF9500' : '#27C93F',
                            borderWidth: 1,
                            borderColor: '#1A1A1A',
                        }}
                    >
                        <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', marginBottom: 8 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{c.aerolinea}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <View style={{
                                        width: 6, height: 6, borderRadius: 3,
                                        backgroundColor: c.isDynamic ? '#FF9500' : '#27C93F', marginRight: 6,
                                    }} />
                                    <Text style={{ color: c.isDynamic ? '#FF9500' : '#27C93F', fontSize: 11, fontWeight: 'bold' }}>{c.estado}</Text>
                                </View>
                            </View>
                        {c.estado.includes('GENERANDO') || c.estado.includes('GESTIONANDO') ? (
                            <ActivityIndicator size="small" color={c.isDynamic ? '#FF9500' : '#27C93F'} />
                        ) : (
                            <Text style={{ fontSize: 18 }}>✅</Text>
                        )}
                        <TouchableOpacity 
                                onPress={() => {
                                    Alert.alert(
                                        "BORRAR EXPEDIENTE",
                                        `¿Estás seguro de que quieres eliminar la reclamación de ${c.aerolinea}?`,
                                        [
                                            { text: "CANCELAR", style: "cancel" },
                                            { text: "BORRAR", style: "destructive", onPress: () => removeClaim(c.id) }
                                        ]
                                    );
                                }}
                                style={{ padding: 10, marginRight: -10, marginLeft: 10 }}
                            >
                                <Text style={{ color: '#555', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Barra de progreso */}
                        <View style={{ backgroundColor: '#222', width: '100%', height: 4, borderRadius: 2, marginVertical: 10 }}>
                            <View style={{
                                backgroundColor: c.isDynamic ? '#FF9500' : '#27C93F',
                                width: c.estado.includes('ENVIADA') ? '60%' : c.isDynamic ? '30%' : '20%',
                                height: '100%', borderRadius: 2,
                            }} />
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                            <Text style={{ color: '#B0B0B0', fontSize: 11 }}>
                                COMPENSACIÓN: <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{c.compensacion}</Text>
                            </Text>
                            <Text style={{ color: '#AF52DE', fontSize: 11, fontWeight: 'bold' }}>
                                {c.estado.includes('FIRMADA') || signedClaimId === c.id ? 'DOCUMENTO FIRMADO ✅' : c.isDynamic ? 'FIRMAR AHORA ✍️' : 'MÁS INFO ›'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))
            )}
            {/* ——— PIE DE PÁGINA ENCRIPTADO ——— */}
            <View style={{ marginTop: 30, opacity: 0.7, alignItems: 'center' }}>
                <Text style={{ color: '#B0B0B0', fontSize: 10, letterSpacing: 1 }}>PROTECCIÓN ENCRIPTADA · AES-256</Text>
            </View>
        </ScrollView>

            {/* ——— MODALS OUTSIDE SCROLLVIEW ——— */}

            <Modal visible={showSignature} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', padding: 25 }}>
                    <View style={{ backgroundColor: '#111', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#333' }}>

                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 40 }}>🖊️</Text>
                            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 10 }}>AUTORIZACIÓN LEGAL</Text>
                            <Text style={{ color: '#B0B0B0', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                                Al firmar, autorizas a Travel-Pilot a iniciar la reclamación de la compensación correspondiente (hasta 600€) en tu nombre según la EU261.
                            </Text>
                        </View>

                        {/* Lienzo de Firma — HTML5 Canvas (curvas suaves) */}
                        <View style={{ height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
                            <WebView
                                ref={webViewRef}
                                originWhitelist={['*']}
                                scrollEnabled={false}
                                bounces={false}
                                onMessage={(event) => {
                                    const data = event.nativeEvent.data;
                                    if (data.startsWith('SIG_DATA:')) { setCapturedSignature(data.replace('SIG_DATA:', '')); setHasSigned(true); return; }
                                    if (data === 'HAS_SIGNATURE') setHasSigned(true);
                                    if (data === 'NO_SIGNATURE') setHasSigned(false);
                                }}
                                source={{
                                    html: `
<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0;touch-action:none;}body{background:#EFEFEF;overflow:hidden;}
canvas{display:block;width:100%;height:100%;}
.placeholder{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
color:#999;font-size:22px;font-weight:bold;opacity:0.3;font-family:sans-serif;pointer-events:none;}</style></head>
<body>
<div class="placeholder" id="ph">Firma aquí</div>
<canvas id="c"></canvas>
<script>
var c=document.getElementById('c'),ctx=c.getContext('2d'),ph=document.getElementById('ph');
var drawing=false,pts=[],totalPts=0;
function resize(){c.width=window.innerWidth;c.height=window.innerHeight;}
resize();window.onresize=resize;
ctx.strokeStyle='#1A1A5E';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.lineJoin='round';

function getXY(e){
  var t=e.touches?e.touches[0]:e;
  var r=c.getBoundingClientRect();
  return{x:t.clientX-r.left,y:t.clientY-r.top};
}

function midPoint(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2};}

c.addEventListener('touchstart',function(e){
  e.preventDefault();drawing=true;
  var p=getXY(e);pts=[p];
  ctx.beginPath();ctx.moveTo(p.x,p.y);
  ph.style.display='none';
},{passive:false});

c.addEventListener('touchmove',function(e){
  e.preventDefault();if(!drawing)return;
  var p=getXY(e);pts.push(p);totalPts++;
  if(pts.length>=3){
    var l=pts.length;
    var m=midPoint(pts[l-2],pts[l-1]);
    ctx.quadraticCurveTo(pts[l-2].x,pts[l-2].y,m.x,m.y);
    ctx.stroke();
  }
  if(totalPts===20)window.ReactNativeWebView.postMessage('HAS_SIGNATURE');
},{passive:false});

c.addEventListener('touchend',function(e){
  e.preventDefault();
  if(pts.length>=2){
    var l=pts.length;
    ctx.lineTo(pts[l-1].x,pts[l-1].y);
    ctx.stroke();
  }
  drawing=false;pts=[];
},{passive:false});

window.clearCanvas=function(){
  ctx.clearRect(0,0,c.width,c.height);
  totalPts=0;ph.style.display='block';
  window.ReactNativeWebView.postMessage('NO_SIGNATURE');
};
</script></body></html>
                                `}}
                            />
                        </View>

                        {/* Botones de acción */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    webViewRef.current?.injectJavaScript('clearCanvas();true;');
                                    setHasSigned(false);
                                }}
                                style={{ flex: 1, backgroundColor: '#222', padding: 16, borderRadius: 12, marginRight: 10, alignItems: 'center' }}
                            >
                                <Text style={{ color: '#B0B0B0', fontWeight: 'bold' }}>BORRAR</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={async () => {
                                    if (!hasSigned) {
                                        Alert.alert('Firma incompleta', 'Por favor, firma de forma clara para que tenga validez legal.');
                                        return;
                                    }
                                    // Exportar firma como PNG base64 desde el canvas HTML
                                    webViewRef.current?.injectJavaScript(`
                                        (function(){
                                          var png = document.getElementById('c').toDataURL('image/png');
                                          window.ReactNativeWebView.postMessage('SIG_DATA:' + png);
                                        })(); true;
                                    `);
                                    // Esperar un momento para recibir el mensaje del WebView
                                    await new Promise(r => setTimeout(r, 600));
                                    setGeneratingPdf(true);
                                    try {
                                        const res = await fetch(`${BACKEND_URL}/api/generateClaim`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                                flightNumber: currentClaimForSig?.vuelo,
                                                airline: currentClaimForSig?.aerolinea,
                                                delayMinutes: currentClaimForSig?.delayActual || 0,
                                                departureAirport: currentClaimForSig?.ruta?.split('>')[0]?.trim() || 'Desconocido',
                                                arrivalAirport: currentClaimForSig?.ruta?.split('>')[1]?.trim() || 'Desconocido',
                                                userEmail: user?.email || 'pasajero@travel-pilot.com',
                                                signatureBase64: capturedSignature,
                                            })
                                        });
                                        const json = await res.json();
                                        if (json.pdfBase64) {
                                            const fileUri = cacheDirectory + `reclamacion_EU261_${Date.now()}.pdf`;
                                            await writeAsStringAsync(fileUri, json.pdfBase64, { encoding: EncodingType.Base64 });
                                            
                                            setSignedClaimId(`DYN-${flightData?.flightNumber}`);
                                            setShowSignature(false);

                                            // Alerta de éxito antes de compartir
                                            Alert.alert(
                                                '✈️ DOCUMENTO GENERADO',
                                                'Tu reclamación ha sido registrada en el sistema central de Travel-Pilot. Ahora procedemos a enviarla a la aerolínea.',
                                                [
                                                    {
                                                        text: 'CONTINUAR Y ENVIAR',
                                                        onPress: async () => {
                                                            const canShare = await Sharing.isAvailableAsync();
                                                            if (canShare) {
                                                                await Sharing.shareAsync(fileUri, { 
                                                                    mimeType: 'application/pdf', 
                                                                    dialogTitle: `Enviar Reclamación ${flightData?.airline}`,
                                                                    UTI: 'com.adobe.pdf'
                                                                });
                                                            } else {
                                                                Alert.alert('✅ PROCESO FINALIZADO', `El PDF legal está listo en la memoria de tu dispositivo.`);
                                                            }
                                                        }
                                                    }
                                                ]
                                            );
                                        } else {
                                            Alert.alert('ERROR', json.error || 'El servidor no devolvió el PDF.');
                                        }
                                    } catch (e) {
                                        Alert.alert('ERROR DE RED', 'La central está saturada. Por favor, inténtalo en unos minutos.');
                                    } finally {
                                        setGeneratingPdf(false);
                                    }
                                }}
                                style={{ flex: 1, backgroundColor: hasSigned ? '#4CD964' : '#333', padding: 16, borderRadius: 12, alignItems: 'center' }}
                            >
                                {generatingPdf
                                    ? <ActivityIndicator color="#000" size="small" />
                                    : <Text style={{ color: hasSigned ? '#000' : '#666', fontWeight: '900' }}>CONFIRMAR Y ENVIAR</Text>
                                }
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => setShowSignature(false)} style={{ marginTop: 25, alignItems: 'center' }}>
                            <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: 'bold' }}>CANCELAR PROCESO</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

            {/* Modal de confirmación eliminado en favor de Alerta nativa */}

            <Modal visible={showRights} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', paddingTop: 60 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 20 }}>
                        <View>
                            <Text style={{ color: '#FFF', fontSize: 21, fontWeight: '900' }}>MANUAL DE DERECHOS</Text>
                            <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold' }}>REGLAMENTO EUROPEO EU261/2004</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowRights(false)} style={{ backgroundColor: '#222', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: '#B0B0B0', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 25 }}>
                        {[
                            { color: '#AF52DE', h: 'RETRASO +2 HORAS', t: 'Derecho de Asistencia', d: 'La aerolínea DEBE darte comida, bebida y acceso a comunicación. Es el momento de guardar tickets si pagas tú.' },
                            { color: '#4CD964', h: 'RETRASO +3 HORAS', t: 'Compensación Económica', d: 'Tienes derecho a una indemnización de entre 250€ y 600€ según la distancia. Travel-Pilot activará el Escudo Legal automáticamente aquí.' },
                            { color: '#FFD700', h: 'RETRASO +5 HORAS', t: 'Derecho a Reembolso', d: 'Ya no estás obligado a viajar. Puedes pedir que te devuelvan el dinero del billete y buscarte la vida.' },
                            { color: '#FF3B30', h: 'CANCELACIÓN', t: 'Protección Total', d: 'Si cancelan con menos de 14 días: Vuelo alternativo + Hotel (si es noche) + Indemnización económica.' },
                            { color: '#007AFF', h: 'OVERBOOKING', t: 'Denegación de Embarque', d: 'Si te dejan fuera por falta de plazas: Reubicación inmediata y compensación económica al instante.' }
                        ].map((r, i) => (
                            <View key={i} style={{ backgroundColor: '#111', padding: 20, borderRadius: 20, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: r.color }}>
                                <Text style={{ color: r.color, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }}>{r.h}</Text>
                                <Text style={{ color: '#FFF', fontSize: 17, fontWeight: 'bold' }}>{r.t}</Text>
                                <Text style={{ color: '#B0B0B0', fontSize: 13, marginTop: 8, lineHeight: 19 }}>{r.d}</Text>
                            </View>
                        ))}

                        <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', marginTop: 10 }}>
                            <Text style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: 14 }}>💡 ATENCIÓN</Text>
                            <Text style={{ color: '#B0B0B0', fontSize: 12, marginTop: 8, lineHeight: 18 }}>
                                Las "circunstancias extraordinarias" (clima extremo, huelgas de controladores) pueden anular la compensación económica, pero NUNCA el derecho a comida, bebida u hotel.
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowRights(false)}
                            style={{ backgroundColor: '#AF52DE', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, marginBottom: 100 }}
                        >
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>ENTENDIDO</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}
