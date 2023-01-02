import { supabase } from "..";

export default class storageAPI {
  static async uploadMonthlyJson(file: string, name: string) {
    const { data, error } = await supabase.storage
      .from("recaps")
      .upload(name, file);

    if (error) {
      console.log(error);
    }

    return data;
  }
}
