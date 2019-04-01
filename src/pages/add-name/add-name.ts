import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
  LoadingController
} from "ionic-angular";
import { AuthProvider } from "../../providers/auth/auth";

/**
 * Generated class for the AddNamePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: "page-add-name",
  templateUrl: "add-name.html"
})
export class AddNamePage {
  name = "";
  gender = "m";

  genders = [
    { value: "m", label: "Masculino" },
    { value: "f", label: "Feminino" }
  ];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewController: ViewController,
    public authService: AuthProvider,
    public loadingController: LoadingController
  ) { }

  ionViewDidLoad() {
    console.log("ionViewDidLoad AddNamePage");
  }

  dismiss() {
    this.viewController.dismiss();
  }

  async addName() {
    const loader = this.authService.customLoading('Adicionando nome, por favor aguarde...');
    loader.present();
    try {
      await this.authService.addCustomNameIfNeeded(this.name, this.gender);
      this.dismiss();
    } catch (error) {

    } finally {
      loader.dismiss();
    }
  }
}
