import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { s } from '../styles';
import { useAppContext } from '../context/AppContext';
import { getEU261Amount } from '../utils/flightUtils';
import { BACKEND_URL } from '../../config';

export default function VaultScreen() {
    const {
        legalShieldActive, setViewDoc, setIsScanning, claims, setClaims, removeClaim, flightData,
        compensationEligible, extraDocs, setExtraDocs, isExtracting, simulateGmailSync, user,
        removeExtraDoc, setHasNewDoc, setRecoveredMoney
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

    const uploadDocument = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("PERMISO DENEGADO", "Se requiere acceso a la galería para subir tus documentos.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false, 
                quality: 0.7,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                const fileType = uri.split('.').pop() || 'jpg';
                setPendingDoc({ uri, type: fileType });

                Alert.alert(
                    "AÑADIR DOCUMENTO",
                    "Pasaporte, Tarjeta de embarque, reservas de hotel, etc.\n\n¿Quieres guardar este documento en tu Bóveda Segura? Se encriptará con AES-256.",
                    [
                        { text: "CANCELAR", style: "cancel", onPress: () => setPendingDoc(null) },
                        { 
                            text: "SÍ, SUBIR AHORA", 
                            onPress: () => {
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

    const handleSendClaim = async (sig: string) => {
        if (!sig || sig.length < 100) {
            Alert.alert('Error de Firma', 'La firma no se ha capturado correctamente. Inténtalo de nuevo.');
            setGeneratingPdf(false);
            return;
        }

        try {
            console.log('[Firma] Enviando payload...', sig.length);
            const res = await fetch(`${BACKEND_URL}/api/generateClaim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    flightNumber: currentClaimForSig?.vuelo,
                    airline: currentClaimForSig?.aerolinea,
                    delayMinutes: currentClaimForSig?.delayActual || 0,
                    status: currentClaimForSig?.status || 'delayed',
                    departureAirport: currentClaimForSig?.ruta?.split('>')[0]?.trim() || 'Desconocido',
                    arrivalAirport: currentClaimForSig?.ruta?.split('>')[1]?.trim() || 'Desconocido',
                    userEmail: user?.email || 'pasajero@travel-pilot.com',
                    signatureBase64: sig,
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || `Error ${res.status}`);
            }

            const json = await res.json();
            if (json.pdfBase64) {
                const fileUri = (FileSystem.cacheDirectory || '') + `reclamacion_EU261_${Date.now()}.pdf`;
                const encoding = (FileSystem.EncodingType as any)?.Base64 || 'base64';
                await FileSystem.writeAsStringAsync(fileUri, json.pdfBase64, { encoding });
                setSignedClaimId(currentClaimForSig?.id);
                setRecoveredMoney((prev: number) => prev + (parseInt(currentClaimForSig?.compensacion) || 250));
                
                // Limpiar la bóveda interna y el panel visual de la firma:
                webViewRef.current?.injectJavaScript('clearCanvas();true;');
                setShowSignature(false);
                setHasSigned(false);
                setCapturedSignature('');
                setCurrentClaimForSig(null);
                
                Alert.alert(
                    '✈️ DOCUMENTO GENERADO',
                    'Tu reclamación ha sido registrada. Ahora procedemos a enviarla a la aerolínea.',
                    [
                        {
                            text: 'CONTINUAR Y ENVIAR',
                            onPress: async () => {
                                const canShare = await Sharing.isAvailableAsync();
                                if (canShare) {
                                    await Sharing.shareAsync(fileUri, { 
                                        mimeType: 'application/pdf', 
                                        dialogTitle: `Enviar Reclamación`,
                                        UTI: 'com.adobe.pdf'
                                    });
                                    Alert.alert('✅ PROCESO FINALIZADO', 'El documento se ha compartido/guardado con éxito. Se está procesando tramitación legal.');
                                } else {
                                    Alert.alert('✅ PROCESO FINALIZADO', `El PDF legal está listo en tu dispositivo.`);
                                }
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('ERROR', json.error || 'El servidor no devolvió el PDF.');
            }
        } catch (e: any) {
            console.error('[Vault] Fallo total:', e.message || e);
            Alert.alert('FALLO TÉCNICO', `Servidor: ${e.message || 'Sin conexión'}. Refresca la app.`);
        } finally {
            setGeneratingPdf(false);
        }
    };

    const documents = Array.isArray(extraDocs) ? extraDocs : [];

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            "🗑️ ELIMINAR DOCUMENTO",
            `¿Estás seguro de que quieres borrar "${name}"?`,
            [
                { text: "CANCELAR", style: "cancel" },
                { text: "BORRAR", style: "destructive", onPress: () => removeExtraDoc(id) }
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 100, paddingBottom: 160, flexGrow: 1 }}>

                {/* ESCUDO LEGAL */}
                {(legalShieldActive || compensationEligible) && (
                    <View style={{
                        backgroundColor: 'rgba(39, 201, 63, 0.08)',
                        padding: 16, borderRadius: 16, marginBottom: 20,
                        borderWidth: 1, borderColor: 'rgba(39, 201, 63, 0.4)',
                        flexDirection: 'row', alignItems: 'center',
                    }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(39, 201, 63, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                            <Text style={{ fontSize: 22 }}>🛡️</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#27C93F', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>PROTECCIÓN LEGAL ACTIVA</Text>
                            <Text style={{ color: '#B0B0B0', fontSize: 11, marginTop: 3 }}>Vigilando tu viaje actual.</Text>
                        </View>
                    </View>
                )}

                {/* ASISTENTE ACTIVO */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => Alert.alert("📊 ASISTENTE ACTIVO", "Protección AES-256 activada.")}
                    style={{ backgroundColor: '#111', padding: 16, borderRadius: 16, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: '#AF52DE', flexDirection: 'row', alignItems: 'center' }}
                >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CD964', marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>🧠 ASISTENTE ACTIVO</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 11, marginTop: 3 }}>Conectado y seguro</Text>
                    </View>
                    <Text style={{ color: '#B0B0B0', fontSize: 19 }}>›</Text>
                </TouchableOpacity>

                {/* ACTUALIZAR EMAIL */}
                <TouchableOpacity
                    onPress={simulateGmailSync}
                    disabled={isExtracting}
                    style={{ backgroundColor: '#1A1A1A', padding: 18, borderRadius: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' }}
                >
                    {isExtracting ? <ActivityIndicator size="small" color="#AF52DE" style={{ marginRight: 10 }} /> : <Text style={{ fontSize: 18, marginRight: 10 }}>📧</Text>}
                    <Text style={{ color: isExtracting ? '#555' : '#AF52DE', fontWeight: '900', fontSize: 14 }}>{isExtracting ? 'BUSCANDO DOCUMENTOS...' : 'ACTUALIZAR CON MIS CORREOS'}</Text>
                </TouchableOpacity>

                {/* SUBIR DOC */}
                <TouchableOpacity
                    onPress={uploadDocument}
                    disabled={uploadingDoc}
                    style={{ backgroundColor: '#111', padding: 18, borderRadius: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D4AF37' }}
                >
                    <Text style={{ fontSize: 24, marginRight: 15 }}>📤</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: uploadingDoc ? '#555' : '#D4AF37', fontWeight: '900', fontSize: 16 }}>{uploadingDoc ? 'ENCRIPTANDO...' : 'AÑADIR DOCUMENTO'}</Text>
                        <Text style={{ color: '#444', fontSize: 11, marginTop: 2 }}>Pasaporte, billetes, etc.</Text>
                    </View>
                </TouchableOpacity>

                {/* LISTA DE DOCS */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 }}>🔐 MIS DOCUMENTOS</Text>
                </View>

                {documents.map((d, i) => (
                    <View key={d.id || i} style={{ backgroundColor: '#111', borderRadius: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1A1A1A', overflow: 'hidden' }}>
                        <TouchableOpacity
                            onPress={() => { setViewDoc(d); setIsScanning(true); setTimeout(() => setIsScanning(false), 2500); }}
                            activeOpacity={0.7}
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 18 }}
                        >
                            <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' }}>
                                {d.i ? <Image source={typeof d.i === 'number' ? d.i : { uri: d.i }} style={{ width: 52, height: 52, borderRadius: 14 }} /> : <Text style={{ fontSize: 21 }}>📄</Text>}
                            </View>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{d.t || 'Documento'}</Text>
                                    {d.isDemo && (
                                        <View style={{ marginLeft: 8, backgroundColor: 'rgba(255, 149, 0, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#FF9500' }}>
                                            <Text style={{ color: '#FF9500', fontSize: 8, fontWeight: '900' }}>DEMO</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={{ color: '#B0B0B0', fontSize: 11, marginTop: 3 }}>{d.s || 'Bóveda Segura'}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(d.id, d.t)} style={{ padding: 20, borderLeftWidth: 1, borderLeftColor: '#222' }}>
                            <Text style={{ color: '#FF3B30', fontSize: 18 }}>✕</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {/* RECLAMACIONES */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 14 }}>
                    <Text style={{ color: '#B0B0B0', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 }}>⚖️ RECLAMACIONES EU261</Text>
                </View>

                <TouchableOpacity onPress={() => setShowRights(true)} style={{ backgroundColor: 'rgba(175, 82, 222, 0.1)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(175, 82, 222, 0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Text style={{ fontSize: 18, marginRight: 10 }}>📖</Text>
                    <Text style={{ color: '#AF52DE', fontWeight: 'bold', fontSize: 13 }}>GUÍA DE DERECHOS</Text>
                </TouchableOpacity>

                {claims.length === 0 ? (
                    <View style={{ backgroundColor: '#0D0D0D', borderRadius: 16, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#222', borderStyle: 'dashed' }}>
                        <Text style={{ fontSize: 31, marginBottom: 12 }}>⚖️</Text>
                        <Text style={{ color: '#B0B0B0', fontSize: 11 }}>No hay reclamaciones activas.</Text>
                    </View>
                ) : (
                    claims.map((c: any, i: number) => (
                        <TouchableOpacity
                            key={c.id || i}
                            onPress={() => {
                                if (signedClaimId === c.id) {
                                    Alert.alert("ESTADO", "Este documento ya está firmado.");
                                } else if (c.isDynamic) {
                                    setCurrentClaimForSig(c);
                                    setShowSignature(true);
                                } else {
                                    Alert.alert(
                                        "📑 DETALLES DE RECLAMACIÓN",
                                        `Vuelo: ${c.vuelo}\nAerolínea: ${c.aerolinea}\nRuta: ${c.ruta}\nEstado: ${c.estado}\nIndemnización estimada: ${c.compensacion}€\n\nEste expediente está siendo gestionado por el departamento legal de Travel-Pilot.`
                                    );
                                }
                            }}
                            style={{ backgroundColor: '#111', borderRadius: 16, padding: 18, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: c.isDynamic ? '#FF9500' : '#27C93F', borderWidth: 1, borderColor: '#1A1A1A' }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{c.aerolinea}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.isDynamic ? '#FF9500' : '#27C93F', marginRight: 6 }} />
                                        <Text style={{ color: c.isDynamic ? '#FF9500' : '#27C93F', fontSize: 11, fontWeight: 'bold' }}>{c.estado}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => removeClaim(c.id)} style={{ padding: 10 }}><Text style={{ color: '#555', fontSize: 18 }}>✕</Text></TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                                <Text style={{ color: '#B0B0B0', fontSize: 11 }}>COMPENSACIÓN: <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{c.compensacion}€</Text></Text>
                                <Text style={{ color: '#AF52DE', fontSize: 11, fontWeight: 'bold' }}>
                                    {signedClaimId === c.id ? 'DOCUMENTO FIRMADO ✅' : c.isDynamic ? 'FIRMAR AHORA ✍️' : 'MÁS INFO ›'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                <View style={{ marginTop: 30, opacity: 0.7, alignItems: 'center' }}>
                    <Text style={{ color: '#B0B0B0', fontSize: 10 }}>PROTECCIÓN ENCRIPTADA · AES-256</Text>
                </View>
            </ScrollView>

            {/* MODAL FIRMA */}
            <Modal visible={showSignature} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', padding: 25 }}>
                    <View style={{ backgroundColor: '#111', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#333' }}>
                         <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 40 }}>🖊️</Text>
                            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 10 }}>AUTORIZACIÓN LEGAL</Text>
                        </View>

                        <View style={{ height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
                            <WebView
                                ref={webViewRef}
                                originWhitelist={['*']}
                                scrollEnabled={false}
                                onMessage={async (event) => {
                                    const msg = event.nativeEvent.data;
                                    if (msg.startsWith('SIG_DATA:')) {
                                        const b64 = msg.replace('SIG_DATA:', '');
                                        setCapturedSignature(b64);
                                        setHasSigned(true);
                                        await handleSendClaim(b64);
                                    } else if (msg === 'HAS_SIGNATURE') {
                                        setHasSigned(true);
                                    } else if (msg === 'NO_SIGNATURE') {
                                        setHasSigned(false);
                                    }
                                }}
                                source={{ html: `
                                    <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>*{margin:0;padding:0;touch-action:none;}body{background:#EFEFEF;overflow:hidden;}canvas{display:block;width:100%;height:100%;}.ph{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#999;font-size:22px;font-weight:bold;opacity:0.3;pointer-events:none;}</style></head>
                                    <body><div class="ph" id="ph">Firma aquí</div><canvas id="c"></canvas>
                                    <script>var c=document.getElementById('c'),ctx=c.getContext('2d'),ph=document.getElementById('ph'),drawing=false,pts=[];function resize(){c.width=window.innerWidth;c.height=window.innerHeight;}resize();window.onresize=resize;ctx.strokeStyle='#1A1A5E';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';
                                    function getXY(e){var t=e.touches?e.touches[0]:e,r=c.getBoundingClientRect();return{x:t.clientX-r.left,y:t.clientY-r.top};}
                                    c.addEventListener('touchstart',function(e){e.preventDefault();drawing=true;var p=getXY(e);pts=[p];ctx.beginPath();ctx.moveTo(p.x,p.y);ph.style.display='none';});
                                    c.addEventListener('touchmove',function(e){e.preventDefault();if(!drawing)return;var p=getXY(e);pts.push(p);if(pts.length>=3){var l=pts.length,m={x:(pts[l-2].x+pts[l-1].x)/2,y:(pts[l-2].y+pts[l-1].y)/2};ctx.quadraticCurveTo(pts[l-2].x,pts[l-2].y,m.x,m.y);ctx.stroke();}if(pts.length>10)window.ReactNativeWebView.postMessage('HAS_SIGNATURE');});
                                    c.addEventListener('touchend',function(e){e.preventDefault();drawing=false;});
                                    window.clearCanvas=function(){ctx.clearRect(0,0,c.width,c.height);ph.style.display='block';window.ReactNativeWebView.postMessage('NO_SIGNATURE');};
                                    window.getSig=function(){var png=c.toDataURL('image/png');window.ReactNativeWebView.postMessage('SIG_DATA:'+png);};
                                    </script></body></html>
                                `}}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity onPress={() => { webViewRef.current?.injectJavaScript('clearCanvas();true;'); setHasSigned(false); }} style={{ flex: 1, backgroundColor: '#222', padding: 16, borderRadius: 12, marginRight: 10, alignItems: 'center' }}>
                                <Text style={{ color: '#B0B0B0', fontWeight: 'bold' }}>BORRAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (!hasSigned) { Alert.alert("Firma incompleta", "Firma el panel."); return; }
                                    setGeneratingPdf(true);
                                    webViewRef.current?.injectJavaScript('getSig();true;');
                                }}
                                style={{ flex: 1, backgroundColor: hasSigned ? '#4CD964' : '#333', padding: 16, borderRadius: 12, alignItems: 'center' }}
                            >
                                {generatingPdf ? <ActivityIndicator color="#000" /> : <Text style={{ color: hasSigned ? '#000' : '#666', fontWeight: 'bold' }}>ENVIAR</Text>}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => setShowSignature(false)} style={{ marginTop: 25, alignItems: 'center' }}>
                            <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: 'bold' }}>CANCELAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL DERECHOS */}
            <Modal visible={showRights} animationType="slide" transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', paddingTop: 60 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25 }}>
                        <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold' }}>DERECHOS EU261</Text>
                        <TouchableOpacity onPress={() => setShowRights(false)}><Text style={{ color: '#B0B0B0', fontSize: 20 }}>✕</Text></TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 25 }}>
                        {[
                            { color: '#AF52DE', h: 'RETRASO +2 HORAS', t: 'Derecho de Asistencia', d: 'La aerolínea DEBE darte comida, bebida y acceso a comunicación. Guarda todos tus tickets.' },
                            { color: '#4CD964', h: 'RETRASO +3 HORAS', t: 'Compensación Económica', d: 'Tienes derecho a una indemnización de entre 250€ y 600€ según la distancia. Travel-Pilot la gestiona por ti.' },
                            { color: '#FFD700', h: 'RETRASO +5 HORAS', t: 'Derecho a Reembolso', d: 'Puedes solicitar el reembolso íntegro del billete si decides no viajar.' },
                            { color: '#FF3B30', h: 'CANCELACIÓN', t: 'Protección Total', d: 'Vuelo alternativo + Hotel + Indemnización económica si avisan con menos de 14 días.' },
                            { color: '#007AFF', h: 'OVERBOOKING', t: 'Denegación de Embarque', d: 'Si te dejan fuera por falta de plazas: Reubicación inmediata y compensación al instante.' }
                        ].map((r, i) => (
                            <View key={i} style={{ backgroundColor: '#111', padding: 20, borderRadius: 20, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: r.color }}>
                                <Text style={{ color: r.color, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }}>{r.h}</Text>
                                <Text style={{ color: '#FFF', fontSize: 17, fontWeight: 'bold' }}>{r.t}</Text>
                                <Text style={{ color: '#B0B0B0', fontSize: 13, marginTop: 8, lineHeight: 19 }}>{r.d}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}
