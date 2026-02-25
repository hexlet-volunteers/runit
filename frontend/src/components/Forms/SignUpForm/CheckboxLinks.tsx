import { Anchor } from '@mantine/core';
import { Link } from 'react-router-dom';

function CheckboxLabel({ t }: { t: (key: string) => string }) {
  const links = [
    { to: '/licenseAgreement', key: 'licenseAgreement' },
    { to: '/policy', key: 'privacyPolicy' },
    { to: '/offer', key: 'publicOffer' },
    { to: '/consent', key: 'consentToProcessing' },
  ];

  return (
    <>
      {t('checkedOutAgree')}
      {links.map(({ to, key }) => (
        <Anchor key={key} component={Link} size="sm" target="_blank" to={to}>
          {t(key)}
        </Anchor>
      ))}
    </>
  );
}

export default CheckboxLabel;
