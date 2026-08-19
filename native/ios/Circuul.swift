import Foundation

/// Circuul iOS client — Universal Links first, clipboard last.
/// Call `Circuul.shared.match(...)` on first open; never block launch.
public final class Circuul {
    public static let shared = Circuul()

    private var appToken: String = ""
    private var apiBase: String = ""
    private let defaults = UserDefaults.standard
    private let installKey = "circuul_install_id"
    private let matchedKey = "circuul_matched"

    public func configure(appToken: String, apiBase: String) {
        self.appToken = appToken
        self.apiBase = apiBase.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }

    public func installId() -> String {
        if let existing = defaults.string(forKey: installKey) { return existing }
        let id = UUID().uuidString
        defaults.set(id, forKey: installKey)
        return id
    }

    /// Fire-and-forget safe. Prefer passing Universal Link `code`; clipboard is last resort.
    public func match(
        platform: String = "ios",
        code: String? = nil,
        clipboardCode: String? = nil,
        idfv: String? = nil,
        completion: (([String: Any]) -> Void)? = nil
    ) {
        if defaults.bool(forKey: matchedKey) {
            completion?(["attributed": false, "reason": "already_matched"])
            return
        }
        guard let url = URL(string: "\(apiBase)/circuul/match") else {
            completion?(["attributed": false, "reason": "bad_url"])
            return
        }
        var body: [String: Any] = [
            "app_token": appToken,
            "platform": platform,
            "install_id": installId(),
        ]
        if let code = code { body["code"] = code }
        if let clipboardCode = clipboardCode { body["clipboard_code"] = clipboardCode }
        if let idfv = idfv { body["idfv"] = idfv }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: req) { data, _, _ in
            self.defaults.set(true, forKey: self.matchedKey)
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let payload = json["data"] as? [String: Any] else {
                completion?(["attributed": false, "reason": "network_error"])
                return
            }
            completion?(payload)
        }.resume()
    }
}
