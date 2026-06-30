let bebcomQrScanner=null,bebcomQrScannerActive=false,bebcomQrScannerStarting=false;
function getScannerLibraryReady(){return typeof Html5Qrcode!=='undefined';}
function openQrCameraScanner(){
  if(!currentUser?.phone){alert('Entre no Clube primeiro.');return;}
  if(!getScannerLibraryReady()){
    openMobileScanner();
    showNotice('scanResult','A câmera ainda não carregou. Você pode colar o código manualmente.','error');
    return;
  }
  const modal=document.getElementById('qrCameraModal');
  if(!modal){openMobileScanner();return;}
  modal.classList.add('active');
  document.body.classList.add('qr-camera-open');
  startQrCameraScanner();
}
async function startQrCameraScanner(){
  if(bebcomQrScannerActive||bebcomQrScannerStarting)return;
  const readerId='qrCameraReader';
  const reader=document.getElementById(readerId);
  const status=document.getElementById('qrCameraStatus');
  if(!reader)return;
  reader.innerHTML='';
  try{
    bebcomQrScannerStarting=true;
    if(status)status.innerText='Inicializando câmera...';
    bebcomQrScanner=new Html5Qrcode(readerId);
    await bebcomQrScanner.start(
      {facingMode:'environment'},
      {fps:10,qrbox:(w,h)=>{const s=Math.floor(Math.min(w,h)*0.72);return{width:s,height:s};},aspectRatio:1.0,disableFlip:false},
      onQrCameraSuccess,
      ()=>{}
    );
    bebcomQrScannerActive=true;
    if(status)status.innerText='Aponte para o QR Code do produto participante.';
  }catch(error){
    console.error('Erro ao abrir câmera:',error);
    if(status)status.innerText='Não foi possível abrir a câmera. Use a digitação manual.';
    document.getElementById('qrManualFallback')?.classList.remove('hidden');
  }finally{
    bebcomQrScannerStarting=false;
  }
}
async function stopQrCameraScanner(){
  try{
    if(bebcomQrScanner&&bebcomQrScannerActive){
      await bebcomQrScanner.stop();
      await bebcomQrScanner.clear();
    }
  }catch(error){
    console.warn('Scanner já estava encerrado:',error);
  }finally{
    bebcomQrScanner=null;
    bebcomQrScannerActive=false;
    bebcomQrScannerStarting=false;
  }
}
async function closeQrCameraScanner(){
  await stopQrCameraScanner();
  document.getElementById('qrCameraModal')?.classList.remove('active');
  document.body.classList.remove('qr-camera-open');
}
async function onQrCameraSuccess(decodedText){
  const code=String(decodedText||'').trim();
  if(!code)return;
  const status=document.getElementById('qrCameraStatus');
  if(status)status.innerText='QR detectado. Validando...';
  if(navigator.vibrate)navigator.vibrate([80,40,80]);
  await stopQrCameraScanner();
  const input=document.getElementById('qrInput');
  if(input)input.value=code;
  await closeQrCameraScanner();
  if(typeof scanQr==='function')await scanQr();
}
function useManualQrInput(){
  closeQrCameraScanner();
  openMobileScanner();
  setTimeout(()=>document.getElementById('qrInput')?.focus(),240);
}
function patchMobileScanFabForCamera(){
  const fab=document.getElementById('mobileScanFab');
  if(fab)fab.onclick=openQrCameraScanner;
}
document.addEventListener('DOMContentLoaded',patchMobileScanFabForCamera);
window.addEventListener('resize',patchMobileScanFabForCamera);
