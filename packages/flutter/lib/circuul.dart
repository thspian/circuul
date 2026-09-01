import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const _installKey = 'circuul_install_id';
const _matchedKey = 'circuul_matched';

class AttributionResult {
  final bool attributed;
  final String? reason;
  final String? code;
  final int? cpaCents;
  final bool duplicate;

  const AttributionResult({
    required this.attributed,
    this.reason,
    this.code,
    this.cpaCents,
    this.duplicate = false,
  });

  factory AttributionResult.fromJson(Map<String, dynamic> json) {
    return AttributionResult(
      attributed: json['attributed'] == true,
      reason: json['reason'] as String?,
      code: json['code'] as String?,
      cpaCents: json['cpa_cents'] as int?,
      duplicate: json['duplicate'] == true,
    );
  }

  factory AttributionResult.unmatched(String reason) =>
      AttributionResult(attributed: false, reason: reason);
}

/// Circuul Flutter client — call [Circuul.instance.match] once on cold start.
class Circuul {
  Circuul._();
  static final instance = Circuul._();

  String _appToken = '';
  String _apiBase = '';

  void configure({required String appToken, required String apiBase}) {
    _appToken = appToken;
    _apiBase = apiBase.endsWith('/') ? apiBase.substring(0, apiBase.length - 1) : apiBase;
  }

  Future<String> installId() async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(_installKey);
    if (existing != null) return existing;
    final id = _generateId();
    await prefs.setString(_installKey, id);
    return id;
  }

  /// Fire-and-forget safe. Never throws. Call once on cold start.
  ///
  /// Pass [code] from a deep link or Universal Link when available.
  /// Pass [idfv] (iOS) or [androidId] (Android) for stronger dedup.
  Future<AttributionResult> match({
    String platform = 'flutter',
    String? code,
    String? clipboardCode,
    String? androidReferrer,
    String? idfv,
    String? androidId,
    String? gaid,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();

      if (prefs.getBool(_matchedKey) == true) {
        return AttributionResult.unmatched('already_matched');
      }

      final id = await installId();

      final body = <String, dynamic>{
        'app_token': _appToken,
        'platform': platform,
        'install_id': id,
      };
      if (code != null) body['code'] = code;
      if (clipboardCode != null) body['clipboard_code'] = clipboardCode;
      if (androidReferrer != null) body['android_referrer'] = androidReferrer;
      if (idfv != null) body['idfv'] = idfv;
      if (androidId != null) body['android_id'] = androidId;
      if (gaid != null) body['gaid'] = gaid;

      // Set flag before the network call to prevent concurrent cold starts
      // (e.g. Flutter hot restart in dev) from firing twice.
      await prefs.setBool(_matchedKey, true);

      final response = await http
          .post(
            Uri.parse('$_apiBase/circuul/match'),
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final data = json['data'] as Map<String, dynamic>?;
      if (data == null) return AttributionResult.unmatched('invalid_response');

      return AttributionResult.fromJson(data);
    } catch (_) {
      return AttributionResult.unmatched('error');
    }
  }

  String _generateId() {
    final rng = Random.secure();
    final bytes = List<int>.generate(16, (_) => rng.nextInt(256));
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }
}
