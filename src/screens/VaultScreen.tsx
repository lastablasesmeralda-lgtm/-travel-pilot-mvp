import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import { cacheDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';
import { BACKEND_URL } from '../../config';

export default function VaultScreen() {
    const {
        legalShieldActive, setViewDoc, setIsScanning, claims, flightData,
        compensationEligible, extraDocs, setExtraDocs, isExtracting, simulateGmailSync, user
    } = useAppContext();

    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [showRights, setShowRights] = useState(false);
    const [showSignature, setShowSignature] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);
    const [signedClaimId, setSignedClaimId] = useState<string | null>(null);
    const webViewRef = useRef<WebView>(null);
    const [capturedSignature, setCapturedSignature] = useState<string | null>(null);

    // Generar reclamación dinámica basada en el vuelo activo
    const dynamicClaims = React.useMemo(() => {
        if (!claims) return [];
        const result = [...claims];
        if (flightData && flightData.status === 'delayed' && (flightData.departure?.delay || 0) >= 180) {
            const alreadyExists = result.some(c => c.id === `DYN-${flightData.flightNumber}`);
            if (!alreadyExists) {
                result.unshift({
                    id: `DYN-${flightData.flightNumber}`,
                    aerolinea: `${flightData.airline || 'Aerolínea'} — ${flightData.flightNumber}`,
                    estado: 'GESTIONANDO RECLAMACIÓN...',
                    compensacion: (flightData.departure?.delay || 0) >= 180 ? '600€' : '250€',
                    progreso: 0.3,
                    isDynamic: true,
                });
            }
        }
        return result;
    }, [claims, flightData]);

    const uploadDocument = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("PERMISO DENEGADO", "Se requiere acceso a la galería para subir documentos, operativo.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                setUploadingDoc(true);
                const uri = result.assets[0].uri;
                const fileType = uri.split('.').pop() || 'jpg';
                const fileName = `doc_${Date.now()}.${fileType}`;

                const formData = new FormData();
                formData.append('file', {
                    uri,
                    name: fileName,
                    type: `image/${fileType}`
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
                            t: 'NUEVO DOCUMENTO TÁCTICO',
                            s: 'Subido por usuario',
                            i: data.url,
                            source: 'VAULT',
                            icon: '🖼️',
                            verified: true
                        },
                        ...extraDocs
                    ]);
                    Alert.alert("ÉXITO", "Documento encriptado y protegido en servidor.");
                } else {
                    Alert.alert("ERROR", data.error || "Fallo en la subida al túnel seguro.");
                }
            }
        } catch (e) {
            Alert.alert("ERROR DE RED", "No se pudo contactar con la central.");
            console.error(e);
        } finally {
            setUploadingDoc(false);
        }
    };

    const documents = [
        {
            t: 'PASAPORTE',
            s: 'ID: ESP-9283 · Vigente',
            i: 'https://images.unsplash.com/photo-1544333346-ced983050275?w=400',
            source: 'VAULT',
            icon: '🪪',
            verified: true,
        },
        {
            t: 'BOARDING PASS',
            s: flightData ? `${flightData.flightNumber} · ${flightData.departure?.iata || 'ORG'} → ${flightData.arrival?.iata || 'DST'}` : 'GATE 12A // FLIGHT TP-90',
            i: 'https://images.unsplash.com/photo-1582559930335-648679198642?w=400',
            source: 'GMAIL',
            icon: '✈️',
            verified: true,
        },
        {
            t: 'RESERVA HOTEL',
            s: flightData ? `Hotel destino · ${flightData.arrival?.airport || 'Ciudad destino'}` : 'CONF: #88291-TX // TOKYO',
            i: 'https://images.unsplash.com/photo-1551882547-ff43c630f5e1?w=400',
            source: 'OUTLOOK',
            icon: '🏨',
            verified: true,
        },
        {
            t: 'COCHE DE ALQUILER',
            s: 'Sixt · Munich Airport // CONF: #G-9921',
            i: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400',
            source: 'VAULT',
            icon: '🚗',
            verified: true,
        },
        ...(Array.isArray(extraDocs) ? extraDocs : []),
    ];

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0A0A0A' }} contentContainerStyle={{ padding: 20, paddingTop: 100, paddingBottom: 120, flexGrow: 1 }}>

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
                    "ESTADO: Operativo\nConectado a: tu email y datos de vuelo\nÚLTIMA ACTUALIZACIÓN: Hace 12 min\n\nTu asistente está vigilando 3 documentos detectados y comprobando tu conexión en tiempo real.",
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

            {/* ——— BOTÓN TÁCTICO: GMAIL SYNC ——— */}
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

            {/* ——— BOTÓN SUBIR DOCUMENTO (AÑADIDO) ——— */}
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
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#D4AF37',
                    borderStyle: uploadingDoc ? 'dashed' : 'solid'
                }}
            >
                {uploadingDoc ? (
                    <ActivityIndicator size="small" color="#D4AF37" style={{ marginRight: 10 }} />
                ) : (
                    <Text style={{ fontSize: 18, marginRight: 10 }}>📤</Text>
                )}
                <Text style={{ color: uploadingDoc ? '#555' : '#D4AF37', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>
                    {uploadingDoc ? 'ENCRIPTANDO DOCUMENTO...' : 'SUBIR PASAPORTE / BILLETE'}
                </Text>
            </TouchableOpacity>

            {/* ——— DOCUMENTACIÓN PROTEGIDA ——— */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 }}>🔐 MIS DOCUMENTOS</Text>
                <View style={{ backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: '#4CD964', fontSize: 9, fontWeight: 'bold' }}>AES-256</Text>
                </View>
            </View>

            {documents.map((d, i) => (
                <TouchableOpacity
                    key={d.t || i}
                    activeOpacity={0.7}
                    style={{
                        backgroundColor: '#111',
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#1A1A1A',
                    }}
                    onPress={() => {
                        if (!d) return;
                        setViewDoc(d);
                        setIsScanning(true);
                        setTimeout(() => setIsScanning(false), 2500);
                    }}
                >
                    {/* Icono + miniatura */}
                    <View style={{
                        width: 52, height: 52, borderRadius: 14,
                        backgroundColor: '#0A0A0A',
                        justifyContent: 'center', alignItems: 'center',
                        borderWidth: 1, borderColor: '#222',
                        overflow: 'hidden',
                    }}>
                        {d.i && <Image source={{ uri: d.i }} style={{ width: 52, height: 52, borderRadius: 14, opacity: 0.6 }} />}
                        <Text style={{ position: 'absolute', fontSize: 21 }}>{d.icon || '📄'}</Text>
                    </View>

                    {/* Info del documento */}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{d.t || 'Documento'}</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 11, marginTop: 3 }}>{d.s || 'Sin detalles'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                            {d.source && d.source !== 'VAULT' ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#AF52DE', marginRight: 5 }} />
                                    <Text style={{ color: '#AF52DE', fontSize: 9, fontWeight: 'bold' }}>DETECTADO EN {d.source}</Text>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#4CD964', marginRight: 5 }} />
                                    <Text style={{ color: '#B0B0B0', fontSize: 8, fontWeight: 'bold' }}>GUARDADO EN LA APP</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Badge VERIFICADO */}
                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={{
                            backgroundColor: 'rgba(175, 82, 222, 0.1)',
                            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                            borderWidth: 1, borderColor: 'rgba(175, 82, 222, 0.3)',
                        }}>
                            <Text style={{ color: '#AF52DE', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>PROTEGIDO</Text>
                        </View>
                        <Text style={{ color: '#B0B0B0', fontSize: 9, marginTop: 6, fontWeight: 'bold' }}>VERIFICAR ›</Text>
                    </View>
                </TouchableOpacity>
            ))}

            {/* ——— GESTIÓN DE REEMBOLSOS EU261 ——— */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 14 }}>
                <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 }}>⚖️ REEMBOLSOS Y RECLAMACIONES</Text>
                {dynamicClaims.length > 0 && (
                    <View style={{ backgroundColor: '#27C93F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>{dynamicClaims.length} ACTIVA{dynamicClaims.length > 1 ? 'S' : ''}</Text>
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
                <Text style={{ color: '#AF52DE', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 }}>MANUAL DE DERECHOS TÁCTICOS EU261</Text>
            </TouchableOpacity>

            {dynamicClaims.length === 0 ? (
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
                dynamicClaims.map((c: any, i: number) => (
                    <TouchableOpacity
                        key={c.id || i}
                        activeOpacity={0.7}
                        onPress={() => {
                            if (c.isDynamic && signedClaimId !== c.id) {
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
                            <ActivityIndicator size="small" color={c.isDynamic ? '#FF9500' : '#27C93F'} />
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
                                {signedClaimId === c.id ? 'FIRMADA ✅' : c.isDynamic ? 'FIRMAR AHORA ✍️' : 'MÁS INFO ›'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))
            )}

            {/* ——— MODAL DE FIRMA TÁCTICA ——— */}
            <Modal visible={showSignature} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', padding: 25 }}>
                    <View style={{ backgroundColor: '#111', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#333' }}>

                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 40 }}>🖊️</Text>
                            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 10 }}>AUTORIZACIÓN LEGAL</Text>
                            <Text style={{ color: '#B0B0B0', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                                Al firmar, autorizas a Travel-Pilot a iniciar la reclamación de 600€ en tu nombre según la EU261.
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
                                                flightNumber: flightData?.flightNumber,
                                                airline: flightData?.airline,
                                                delayMinutes: flightData?.departure?.delay || 0,
                                                departureAirport: flightData?.departure?.airport,
                                                arrivalAirport: flightData?.arrival?.airport,
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

            {/* ——— MODAL DE DERECHOS TÁCTICOS ——— */}
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
                            { color: '#4CD964', h: 'RETRASO +3 HORAS', t: 'Compensación Económica', d: 'Tienes derecho a entre 250€ y 600€ en efectivo. Travel-Pilot activará el Escudo Legal automáticamente aquí.' },
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
                            <Text style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: 14 }}>💡 RECORDATORIO TÁCTICO</Text>
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

            {/* ——— PIE DE PÁGINA ENCRIPTADO ——— */}
            <View style={{ marginTop: 30, opacity: 0.7, alignItems: 'center' }}>
                <Text style={{ color: '#B0B0B0', fontSize: 10, letterSpacing: 1 }}>SEGURIDAD ENCRIPTADA · GRADO MILITAR AES-256</Text>
            </View>
        </ScrollView>
    );
}
