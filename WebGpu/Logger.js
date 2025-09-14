export class Logger {
    static continuousLog(message) {
        document.getElementById('log').innerHTML = message;
    }
    
    static matrixLog(matrix, options={}) {
        let {prefix = "", suffix = ""} = options;
        let string = prefix;
        for (let i = 0, l = matrix.size()[0]; i < l; i++) {
            string += "<br/>["
            for (let j = 0; j < matrix.size()[1]; j++) {
                string += matrix.get([i, j]).toFixed(3);
                string += ",  "
            }
            string += "]";
        }
        string += "<br/>";
        string += suffix;
        return string;
    }
}