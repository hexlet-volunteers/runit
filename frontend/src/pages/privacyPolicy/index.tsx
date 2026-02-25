import { useTranslation } from 'react-i18next';

function PrivacyPolicy() {
  const { t: tPP } = useTranslation('translation', { keyPrefix: 'privPolicy' });

  return (
    <div className="container-fluid py-5 m-0">
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-9">
            <div className="mb-4">
              <h2>{tPP('header')}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
