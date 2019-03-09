import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController
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
    public authService: AuthProvider
  ) {}

  ionViewDidLoad() {
    console.log("ionViewDidLoad AddNamePage");
  }

  dismiss() {
    this.viewController.dismiss();
  }

  async addName() {
    await this.authService.addCustomNameIfNeeded(this.name, this.gender);
    // this.dismiss()
  }
}
