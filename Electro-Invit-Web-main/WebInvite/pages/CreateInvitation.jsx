import React, { useState } from 'react';

function CreateInvitation({ setdata }) {
    const [formData, setFormData] = useState({
        statut: '',
        fullName: '',
        table: '',
        phoneNumber: '',
        comment: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setdata({...formData,idSecret: `${formData.fullName}/Qrcodevalide`});
    };

    return (
        <div className="container mt-5">
            <h1>Create Invitation</h1>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Statut</label>
                    <div>
                        <div className="form-check form-check-inline">
                            <input className="form-check-input" type="radio" id="statutCouple" name="statut" value="Couple" onChange={handleChange} required />
                            <label className="form-check-label" htmlFor="statutCouple">Couple</label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input className="form-check-input" type="radio" id="statutMme" name="statut" value="Mme" onChange={handleChange} required />
                            <label className="form-check-label" htmlFor="statutMme">Mme</label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input className="form-check-input" type="radio" id="statutMr" name="statut" value="Mr" onChange={handleChange} required />
                            <label className="form-check-label" htmlFor="statutMr">Mr</label>
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input type="text" className="form-control" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="table">Table</label>
                    <input type="text" className="form-control" id="table" name="table" value={formData.table} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input type="tel" className="form-control" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="comment">Comment</label>
                    <textarea className="form-control" id="comment" name="comment" value={formData.comment} onChange={handleChange}></textarea>
                </div>
                <button type="submit" className="btn btn-primary mt-4">Create</button>
            </form>
        </div>
    );
}

export default CreateInvitation;
