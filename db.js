import JSONFS from './jsonFS.js'
import saveToGit from './saveToGit.js';

class Db {
    constructor(data) {
        this.data = data
        this.jsonFs = new JSONFS();
    }
    getDataFromGit(config){
        let data = new saveToGit(config).retrieveFileAPI()
    }
    // Returns the data within the database
    getData() {
        let jsondata = this.jsonFs.getJSON()
        console.log(jsondata)
        return this.jsonFs.getJSON()
    }

    // Sets the data variable and saves to the data folder
    setData(newData) {
        this.data = newData
        this.saveData(newData)
    }

    // Saves data to the data folder
    saveData(data) {
        this.jsonFs.setJSON(data)
    }
}

export default Db;