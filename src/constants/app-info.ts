import PackageJson from '../../package.json'

class AppInfo {
  static readonly name = '肝武Helper'
  static readonly version = PackageJson.version
  static readonly lastUpdate = PackageJson.last_update

  static readonly repoUrl = `https://github.com/InfSein/${PackageJson.name}`
}

export default AppInfo
