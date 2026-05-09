import React from 'react';
import QRCode from 'qrcode.react';
// import exportAsImage from '../script/SaveImage';
import html2canvas from 'html2canvas';
import './CreateInvitation.css'
function Invitation({ invitationData }) {
    const captureRef = React.useRef();
    console.log(captureRef);
    const exportAsImage = async ( imageFileName) => {
        const canvas = await html2canvas(captureRef.current);
        const image = canvas.toDataURL("image/png", 10);
        downloadImage(image, imageFileName);
        };
        const downloadImage = (blob, fileName) => {
        const fakeLink = window.document.createElement("a");
        fakeLink.style = "display:none;";
        fakeLink.download = fileName;
        
        fakeLink.href = blob;
        
        document.body.appendChild(fakeLink);
        fakeLink.click();
        document.body.removeChild(fakeLink);
        
        fakeLink.remove();
        };
        

        return (
        <div className="containerTout">
        <div className="containerInvi"
            ref={captureRef}
            >
            <div className="cardInvit">
                <div className="content">
                    <h3 className="salutation">Hey, {invitationData.statut} {invitationData.fullName}</h3>
                    <h3 className="invi">Vous etes invité dans le mariage de </h3>
                    <h1 className="marié">Grace et Davina </h1>
                    <h2 className="invi mb-0">14 juin 2024 a 19h00</h2>
                    <h2 className="invi mt-2">Salle victoria</h2>
                    <p className="invi">ref : rond point kinkanda</p>
                    <div className="contenaireQr">
                        <QRCode     
                            value={JSON.stringify(invitationData)} 
                            size={300}    
                        />
                    </div>
                    <p className="invi mb-0">Attention l'invitation est unique et ne peut etre utilisé par 2 personne</p>
                    <p className="inviNous mt-0">ce systeme d'invitation est fait par kollectif numerique 0892669552</p>
                </div>
            </div>
        </div>
            <button className='btn btn-primary mt-4 mb-0' onClick={() => exportAsImage(`Invitation de ${invitationData.fullName} ${invitationData.phoneNumber}`)}>
                Capture Image
            </button>
            </div>
    );
}

export default Invitation;
