import { Component, Input } from '@angular/core';
import { AlertController, NavController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { AuthProvider } from '../../providers/auth/auth';

/**
 * Generated class for the AddPartnerComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'add-partner',
  templateUrl: 'add-partner.html'
})
export class AddPartnerComponent {

  @Input() initial = false;

  constructor(
    private navController: NavController,
    public alertController: AlertController,
    public barcodeScanner: BarcodeScanner,
    public authProvider: AuthProvider
  ) {
  }
  ionViewDidEnter() {
    
  }
  showPrompt() {
    const prompt = this.alertController.create({
      title: "Adicionar Parceiro",
      message: "Entre com o email do parceiro",
      inputs: [{ name: "email", placeholder: "Email" }],
      buttons: [
        {
          text: "Cancelar"
        },
        {
          text: "Adicionar Parceiro",
          handler: data => {
            this.addPartner(data.email)
              .then(() => {
                console.log('INITIAL', this.initial);
                if (this.initial === true) {
                  this.navController.setRoot('TabsPage');
                }
                prompt.dismiss();
              })
              .catch(() => null);
            return false;
          }
        }
      ]
    });
    prompt.present();
  }
  async addPartner(email: string) {
    const loader = this.authProvider.customLoading("Adicionando parceiro, aguarde...");
    loader.present();
    try {
      await this.authProvider.addPartner(email);
    } finally {
      loader.dismiss();
    }
  }
  async scanQrCode(): Promise<void> {
    const barcodeScanResult = await this.barcodeScanner
      .scan({
        resultDisplayDuration: 0,
        orientation: "portrait",
        prompt: 'Mire no QRCODE do parceiro para adicioná-lo automaticamente'
      });
    if (!barcodeScanResult.cancelled) {
      this.addPartner(barcodeScanResult.text);
    }
  }
}
