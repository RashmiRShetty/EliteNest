import React from 'react';
import "../Seller.css";

const Icons = {
  Megaphone: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>,
  Image: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  MapPin: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  FileText: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  CheckCircle: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
};

const SellerTipsAndBenefits = () => {
  return (
    <div className="seller-content-wrapper">
      <section className="seller-section">
        <h2 className="section-title">Tips on Selling a Property Online</h2>
        <div className="tips-list">
          <div className="tip-item">
            <div className="tip-icon-circle"><Icons.Megaphone /></div>
            <div className="tip-content">
              <h3>Post your Property Ad</h3>
              <p>Enter all details like locality name, amenities etc. along with uploading Photos</p>
            </div>
          </div>
          <div className="tip-item">
            <div className="tip-icon-circle"><Icons.Image /></div>
            <div className="tip-content">
              <h3>Add Quality Photos</h3>
              <p>Do not forget to add high-quality photos as it's key for any property to stand out. You can always request a photoshoot of your property through Elite Nest "Photoshoot Service".</p>
            </div>
          </div>
          <div className="tip-item">
            <div className="tip-icon-circle"><Icons.MapPin /></div>
            <div className="tip-content">
              <h3>Choose Correct Locality/Address</h3>
              <p>Make sure to accurately map your locality while filling in the details of your property. Adding a correct locality is essential to receive genuine queries for your property.</p>
            </div>
          </div>
          <div className="tip-item">
            <div className="tip-icon-circle"><Icons.FileText /></div>
            <div className="tip-content">
              <h3>Write a Great Description</h3>
              <p>Provide a short description for your property highlighting the key USPs and all the relevant details to help buyers make a decision. On Elite Nest, you can always request a stellar description by "Content Experts".</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <div className="seller-section-alt">
        <div className="seller-section-inner">
          <h2 className="section-title">Benefits of Selling Your Property Online</h2>
          <p className="section-subtitle">
            With a plethora of real estate websites to choose from, posting property online is now easy, convenient and hassle-free. Here are some benefits of buying and selling your property online:
          </p>
          <div className="benefits-list">
            <div className="benefit-item">
              <div className="benefit-icon"><Icons.CheckCircle /></div>
              <div className="benefit-content">
                <h3>Time-Efficient</h3>
                <p>Selling your property online with portals such as Elite Nest can help you save time, manage your bookings at your convenience and receive quality leads quickly.</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon"><Icons.CheckCircle /></div>
              <div className="benefit-content">
                <h3>Get Better Exposure To Potential Buyers</h3>
                <p>A large number of prospective buyers search online, a far easier way than visiting individuals properties. This helps your property get wider exposure to lakhs of buyers present online.</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon"><Icons.CheckCircle /></div>
              <div className="benefit-content">
                <h3>Cost-Effective</h3>
                <p>By opting to sell online, you can expect a significant reduction in agent fees and overall cost associated with selling a home traditionally.</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon"><Icons.CheckCircle /></div>
              <div className="benefit-content">
                <h3>More Services</h3>
                <p>Not only Elite Nest offers a multitude of property services such as rent agreements, home cleaning, renovation, tenant verification, and more for your convenience.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerTipsAndBenefits;
