import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import OrderForm from '../components/OrderForm';

const OrderPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="bg-[#003087]">
          <IonTitle className="text-white font-montserrat text-2xl">BrightWaw</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="bg-gray-100">
        <div className="max-w-md mx-auto pt-6">
          <h2 className="text-2xl font-montserrat font-semibold text-[#003087] mb-6 px-6">Сделать заказ</h2>
          <OrderForm />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default OrderPage;